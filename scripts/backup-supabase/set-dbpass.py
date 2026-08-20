#!/usr/bin/env python3
"""
set-dbpass.py — Lee la contraseña de la DB del cloud guardada ofuscada
(como char codes) en ~/.filipenses-backup/dbpass.obf y arma el CLOUD_DB_URL
en ~/.filipenses-backup/.env (permisos 600). NO imprime la contraseña.

Generar el archivo .obf (en tu terminal, sin pasar por el chat):
    read -s p && python3 -c "import sys;print(','.join(str(ord(c)) for c in sys.stdin.read().strip()))" <<< "$p" > ~/.filipenses-backup/dbpass.obf
"""
import os, pathlib

BACKUP_DIR = pathlib.Path(os.path.expanduser("~/.filipenses-backup"))
OBF = BACKUP_DIR / "dbpass.obf"
ENV = BACKUP_DIR / ".env"

REF = os.environ.get("CLOUD_REF", "phcpmgfpuobeyptbbgcy")
# region fija de este proyecto (us-east-2) -> host pooler
REGION = os.environ.get("CLOUD_REGION", "us-east-2")
POOLER = f"aws-0-{REGION}.pooler.supabase.com"

if not OBF.exists():
    raise SystemExit(f"[ERR] No existe {OBF}. Generalo con el comando indicado arriba.")

codes = [int(x) for x in OBF.read_text().strip().split(",") if x != ""]
password = "".join(chr(c) for c in codes)
if not password:
    raise SystemExit("[ERR] Contraseña vacía.")

url = f"postgresql://postgres.{REF}:{password}@{POOLER}:6543/postgres"

# Conservar cualquier otra variable ya presente en .env (merge)
entries = {}
if ENV.exists():
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            entries[k] = v

entries["CLOUD_DB_URL"] = f"'{url}'"
content = "\n".join(f"{k}={v}" for k, v in entries.items()) + "\n"
ENV.write_text(content)
os.chmod(ENV, 0o600)

print(f"[OK] CLOUD_DB_URL escrito en {ENV} (chmod 600). Host: {POOLER}")
print("     No se muestra la contraseña en pantalla.")
