# Backup Supabase — Filipenses-413

Espejo del **Supabase local (PROD)** hacia el **project cloud (DR)** `phcpmgfpuobeyptbbgcy`, usando la **Management API (PAT)** — no requiere contraseña del Postgres cloud.

## Archivos
| Archivo | Función |
|---------|---------|
| `backup.py` | Backup real: lee los datos locales y reemplaza el estado del cloud (trunca + reinserta, remapeando `user_id` por email hacia el usuario cloud) |
| `backup.sh` | Wrapper que ejecuta `backup.py` (logs en `~/.filipenses-backup/logs/`, estado en `~/.filipenses-backup/state`) |
| `run.sh` | Wrapper del cron: decide si toca respaldar hoy (sábado 12:00 + reintento diario hasta lograrlo) |
| `migrate_cloud_to_local.py` | Migración inicial (una vez): trajo los datos reales del cloud al local (ya ejecutada) |
| `set-dbpass.py` | *(legacy)* lee la contraseña del DB cloud ofuscada — ya no es necesaria para el backup |

## Cómo funciona el backup
1. Lee la data local (6 tablas: profiles, projects, secrets, activity_logs, user_ai_keys, user_ai_preferences).
2. En el cloud: `TRUNCATE ... CASCADE` + reinserta los datos, **remapeando** `user_id` (y `profiles.id`) del usuario local al usuario cloud por **email** (mantiene FKs y auth coherentes).
3. Escribe `~/.filipenses-backup/state` con la fecha de éxito → `run.sh` no vuelve a correr hasta el próximo sábado.

## Instalar
1. Credenciales privadas en `~/.filipenses-backup/.env` (chmod 600): `CLOUD_REF`, `SUPABASE_ACCESS_TOKEN`, `LOCAL_DB_PASSWORD`. *(No se versionan ni se muestran.)*
2. Cron — **sábado 12:00 con reintento diario**:
   ```cron
   0 12 * * * /Users/servidor-montes/filipenses-413/scripts/backup-supabase/run.sh >> /Users/servidor-montes/.filipenses-backup/logs/cron.log 2>&1
   ```
   El cron corre a diario a las 12:00; `run.sh` ejecuta solo si la semana está pendiente (sábado normalmente; si falla, domingo/lunes… hasta lograrlo).

## Pruebas realizadas (2026-08-19)
- Migración inicial cloud → local: OK (7 proyectos, 18 secrets, 28 activity, 3 ai_keys, 1 pref).
- Backup local → cloud: OK, cloud verificado íntegro con user_id remapeados.
- Lógica de reintento de `run.sh`: OK (saltea si el backup ya se hizo esta semana).

## Seguridad
- El `.env` con el PAT vive en `~/.filipenses-backup/`, fuera del repo.
- El backup usa la Management API con el PAT; no se guarda ni transporta la contraseña del Postgres.
