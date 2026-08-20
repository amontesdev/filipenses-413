#!/usr/bin/env python3
"""
backup.py — Backup semanal Supabase: LOCAL (PROD) -> CLOUD (DR).
Copia los datos reales del local hacia el cloud usando la Management API (PAT),
sin necesidad de contraseña del Postgres cloud. Reemplaza el estado del cloud
(DR) con un espejo del local, remapeando user_id por email hacia el cloud.
Lee credenciales de ~/.filipenses-backup/.env (chmod 600). No imprime secretos.
"""
import os, sys, json, pathlib, subprocess, urllib.request

BACKUP = pathlib.Path(os.path.expanduser("~/.filipenses-backup"))
ENV = BACKUP / ".env"
STATE = BACKUP / "state"
PGIMG = "postgres:17"
TABLES = ["profiles", "projects", "secrets", "activity_logs", "user_ai_keys", "user_ai_preferences"]

def load_env():
    env = {}
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1); env[k] = v.strip().strip('"').strip("'")
    return env

def cloud_query(env, sql):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{env['CLOUD_REF']}/database/query",
        method="POST", data=json.dumps({"query": sql}).encode())
    req.add_header("Authorization", "Bearer " + env["SUPABASE_ACCESS_TOKEN"])
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

def local_psql(env, sql):
    sqlfile = BACKUP / "run_backup.sql"
    sqlfile.write_text(sql)
    cmd = ["docker", "run", "--rm", "--network", "host",
           "-v", f"{BACKUP}:/bkp",
           "-e", f"PGPASSWORD={env.get('LOCAL_DB_PASSWORD','')}", PGIMG, "psql",
           "postgresql://postgres@127.0.0.1:64322/postgres", "-v", "ON_ERROR_STOP=1",
           "-t", "-A", "-f", "/bkp/run_backup.sql"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    sqlfile.unlink(missing_ok=True)
    if r.returncode != 0:
        raise RuntimeError("psql local falló: " + r.stderr[-2000:])
    return r.stdout

def sql_lit(v, coltype):
    if v is None:
        return "NULL"
    if coltype in ("jsonb", "json"):
        s = json.dumps(v) if not isinstance(v, str) else v
        return "'" + s.replace("'", "''") + "'::jsonb"
    if "timestamp" in coltype:
        return "'" + str(v).replace("'", "''") + "'::timestamptz"
    if coltype == "uuid":
        return "'" + str(v) + "'::uuid"
    if coltype in ("bigint", "smallint", "integer"):
        return str(v)
    if coltype == "boolean":
        return "true" if v else "false"
    return "'" + str(v).replace("'", "''") + "'"

def main():
    env = load_env()
    for k in ("CLOUD_REF", "SUPABASE_ACCESS_TOKEN", "LOCAL_DB_PASSWORD"):
        if not env.get(k):
            raise SystemExit(f"[ERR] falta {k} en {ENV}")

    log(env, "=== backup start ===")
    # mapa user_id local -> cloud por email
    local_users = local_psql(env, "select id, email from auth.users;")
    mapping = {}
    lrows = [l.split("|") for l in local_users.strip().splitlines() if "|" in l]
    for lid, lmail in lrows:
        cres = cloud_query(env, f"select id from auth.users where email='{lmail.replace(chr(39), chr(39)+chr(39))}' limit 1;")
        if cres:
            mapping[lid] = cres[0]["id"]

    # leer datos locales (como csv-ish) y sus columnas
    colinfo = {}
    coldata = {}
    for t in TABLES:
        cols = [c["column_name"] for c in cloud_query(env,
            f"select column_name from information_schema.columns where table_schema='public' and table_name='{t}' order by ordinal_position;")]
        coltypes = {c["column_name"]: c["data_type"] for c in cloud_query(env,
            f"select column_name,data_type from information_schema.columns where table_schema='public' and table_name='{t}';")}
        colinfo[t] = (cols, coltypes)
        out = local_psql(env, f"select row_to_json(r) from (select * from public.{t} order by created_at) r;")
        coldata[t] = [json.loads(ln) for ln in out.strip().splitlines() if ln.strip()]
        log(env, f"  {t}: {len(coldata[t])} filas locales")

    # construir SQL para el cloud
    truncate = "TRUNCATE TABLE " + ", ".join(f"public.{t}" for t in TABLES) + " CASCADE;"
    inserts = [truncate]
    for t in TABLES:
        cols, coltypes = colinfo[t]
        for row in coldata[t]:
            vals = []
            for col in cols:
                v = row.get(col)
                # remapear user_id (y profiles.id == user id) al cloud
                if col in ("user_id", "id") and v is not None and str(v) in mapping:
                    v = mapping[str(v)]
                vals.append(sql_lit(v, coltypes.get(col, "text")))
            inserts.append(f"INSERT INTO public.{t} ({', '.join(cols)}) VALUES ({', '.join(vals)});")
    log(env, "Escribiendo en cloud...")
    cloud_query(env, "\n".join(inserts))
    log(env, "Backup OK. Estado actualizado.")
    STATE.write_text(str(__import__("datetime").date.today()) + "\n")
    print("Backup completado. state =", STATE.read_text().strip())

def log(env, msg):
    import datetime
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    d = BACKUP / "logs"; d.mkdir(parents=True, exist_ok=True)
    with open(d / f"backup-{datetime.date.today()}.log", "a") as f:
        f.write(line + "\n")

if __name__ == "__main__":
    main()
