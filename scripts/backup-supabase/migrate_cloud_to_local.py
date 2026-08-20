#!/usr/bin/env python3
"""
migrate_cloud_to_local.py — Migración inicial (una vez): Supabase CLOUD -> LOCAL.
Trae los datos reales del cloud (producción actual) hacia el local (nuevo PROD),
remapeando el user_id del usuario cloud hacia el usuario local (misma persona).
Preserva los UUID de projects/activity/etc. para no romper FKs internas.
Lee credenciales de ~/.filipenses-backup/.env (chmod 600). No imprime secretos.
"""
import os, sys, json, pathlib, subprocess, urllib.request

BACKUP = pathlib.Path(os.path.expanduser("~/.filipenses-backup"))
ENV = BACKUP / ".env"
PGIMG = "postgres:17"

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
        method="POST",
        data=json.dumps({"query": sql}).encode())
    req.add_header("Authorization", "Bearer " + env["SUPABASE_ACCESS_TOKEN"])
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

def local_psql(env, sql):
    sqlfile = BACKUP / "run_migration.sql"
    sqlfile.write_text(sql)
    cmd = ["docker", "run", "--rm", "--network", "host",
           "-v", f"{BACKUP}:/bkp",
           "-e", f"PGPASSWORD={env['LOCAL_DB_PASSWORD']}", PGIMG, "psql",
           "postgresql://postgres@127.0.0.1:64322/postgres", "-v", "ON_ERROR_STOP=1",
           "-t", "-A", "-f", "/bkp/run_migration.sql"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    sqlfile.unlink(missing_ok=True)
    if r.returncode != 0:
        raise RuntimeError("psql falló: " + r.stderr[-2000:])
    return r.stdout

def local_scalar(env, sql):
    return (local_psql(env, sql).strip() or None)

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

    cloud_user = cloud_query(env, "select id from auth.users order by created_at limit 1")[0]["id"]
    local_user = local_scalar(env, "select id from auth.users order by created_at limit 1;")
    if not local_user:
        raise SystemExit("[ERR] no hay usuario local")
    print(f"usuario cloud: {cloud_user}")
    print(f"usuario local: {local_user}")

    tables = ["projects", "secrets", "activity_logs", "user_ai_keys", "user_ai_preferences"]
    ins_sql = ["BEGIN;"]
    for t in tables:
        cols = [c["column_name"] for c in cloud_query(env,
            f"select column_name from information_schema.columns where table_schema='public' and table_name='{t}' order by ordinal_position;")]
        coltypes = {c["column_name"]: c["data_type"] for c in cloud_query(env,
            f"select column_name,data_type from information_schema.columns where table_schema='public' and table_name='{t}';")}
        rows = cloud_query(env, f"select * from public.{t};")
        print(f"  {t}: {len(rows)} filas del cloud")
        for row in rows:
            vals = []
            for col in cols:
                v = row.get(col)
                if col == "user_id" and v is not None and str(v) == str(cloud_user):
                    v = local_user
                vals.append(sql_lit(v, coltypes.get(col, "text")))
            ins_sql.append(f"INSERT INTO public.{t} ({', '.join(cols)}) VALUES ({', '.join(vals)});")
    ins_sql.append("COMMIT;")
    print("Ejecutando en local...")
    local_psql(env, "\n".join(ins_sql))
    print("Hecho.")
    print("=== Verificación final en LOCAL ===")
    print(local_psql(env, """select 'projects' t,count(*) n from public.projects
      union all select 'secrets',count(*) from public.secrets
      union all select 'activity_logs',count(*) from public.activity_logs
      union all select 'user_ai_keys',count(*) from public.user_ai_keys
      union all select 'user_ai_preferences',count(*) from public.user_ai_preferences;"""))

if __name__ == "__main__":
    main()
