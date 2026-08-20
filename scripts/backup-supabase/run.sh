#!/usr/bin/env bash
# =============================================================================
# run.sh — wrapper para el cron. Decide SI hoy corresponde respaldar.
#
# Objetivo del cliente: backup semanal los sábados 12:00.
# Si el sábado no se pudo (server apagado, error), reintenta al día siguiente,
# y así sucesivamente HASTA que el backup se logre.
#
# Lógica: se mantiene la fecha del último backup exitoso en ~/.filipenses-backup/state.
#   - Si el último backup exitoso >= el último sábado  -> ya se respaldó esta semana -> NO corre.
#   - Si el último backup es anterior al último sábado (o no hay registro) -> corre AHORA.
#
# El cron debe invocar este script a diario (0 12 * * *).
# =============================================================================
set -uo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
BACKUP_DIR="${FILIPENSES_BACKUP_DIR:-$HOME/.filipenses-backup}"
STATE_FILE="$BACKUP_DIR/state"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

due=$(python3 - "$STATE_FILE" <<'PY'
import sys, datetime
sf = sys.argv[1]
today = datetime.date.today()
# Último sábado pasado (hoy si es sábado)
last_sat = today - datetime.timedelta(days=(today.weekday() - 5) % 7)
try:
    with open(sf) as f:
        last_ok = datetime.date.fromisoformat(f.read().strip())
    print("NO" if last_ok >= last_sat else "YES")
except (FileNotFoundError, ValueError):
    print("YES")
PY
)

if [ "$due" != "YES" ]; then
  echo "[run] $(date '+%F %T') backup ya realizado esta semana; no se corre."
  exit 0
fi

echo "[run] $(date '+%F %T') backup pendiente -> ejecutando"
"$SCRIPT_DIR/backup.sh"
