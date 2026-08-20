# US-003 — Supabase local como PROD + respaldo semanal en Supabase Cloud

## 📋 Información General

| Campo | Valor |
|-------|-------|
| **ID** | `US-003` |
| **Título** | Supabase local como PROD + respaldo semanal en Supabase Cloud |
| **Rol afectado** | `dev` |
| **Prioridad** | `alta` |
| **Dependencias** | US-001 (entorno local) |
| **Estado** | `pendiente` |

---

## 🎯 Descripción

> **Como** dueño de la herramienta interna filipenses
> **Quiero** que el **Supabase local** sea el entorno de **producción** (fuente de verdad)
> **Para** tener mis datos bajo control total en mi servidor, con **Supabase Cloud como respaldo** y un **push automático semanal**

### Contexto adicional

La app filipenses-413 corre contra Supabase local (`http://100.109.82.30:64321`, Docker).

Se define el nuevo modelo de operación:
1. **Local = PROD**: única fuente de verdad para operar la herramienta.
2. **Cloud = RESPALDO**: copia de seguridad de emergencia / disaster recovery (DR).
3. **Push semanal automático (cada sábado)**: el local (prod) se sincroniza hacia el cloud como backup.
4. **Dirección confirmada:** local → cloud (el local es la fuente; el cloud se actualiza como copia).
5. **Alcance:** entra TODO → schema (migraciones), datos de todas las tablas, `auth.users`, y storage (archivos/buckets).

---

## 🟢 Happy Path

1. **Migración inicial (una vez):** copiar del Supabase Cloud actual hacia el local (schema + datos + `auth.users` + storage).
2. Verificar que la app funcione contra el local con los datos migrados.
3. **Script de backup:** herramienta que copia el estado completo del local (prod) hacia el cloud (DB + auth + storage).
4. **Automatizar:** programar el script con **cron, todos los sábados**.
5. **Verificar restauración:** probar una restauración desde el cloud para confirmar que el respaldo sirve.

---

## ⚠️ Edge Cases

### Edge Case 1: Conflictos de IDs / duplicados al migrar
**Escenario:** Los `auth.users.id` (UUIDs) o `profiles.id` ya existen con distinta data o violan FKs.
**Resultado esperado:** Estrategia de *upsert* que respete IDs y relaciones (FK), sin duplicar filas.

### Edge Case 2: Datos sensibles (`secrets` / `user_ai_keys`)
**Escenario:** Hay datos cifrados o secretos en esas tablas.
**Resultado esperado:** El backup conserva el cifrado tal cual; no se exponen secretos en claro y no se descifran en tránsito.

### Edge Case 3: Storage (archivos/imágenes)
**Escenario:** Existen buckets con archivos.
**Resultado esperado:** El backup incluye storage (no solo la DB). Se valida conteo/checksum de objetos.

### Edge Case 4: Fallo del cron / respaldo incompleto
**Escenario:** El sábado no corre (servidor apagado, error de red) o el respaldo se corta a mitad.
**Resultado esperado:** El script es idempotente, registra logs, y falla de forma visible (alerta) para reintentar sin corromper el respaldo.

### Edge Case 5: `auth.users` entre proyectos distintos
**Escenario:** Los usuarios de auth tienen IDs/identidades atadas al proyecto cloud.
**Resultado esperado:** Los IDs de referencia se preservan. El login OAuth de GitHub sigue funcionando (se re-crea la identidad al loguear) y las FK hacia `profiles`/`auth.users` quedan consistentes.

---

## ✅ Definition of Ready (DoR)

- [ ] Descripción y happy path validados ✅
- [ ] Dirección del push confirmada: local → cloud ✅
- [ ] Alcance confirmado: schema + datos + `auth.users` + storage ✅
- [ ] Automatización confirmada: cron cada sábado ✅
- [x] **Enlazar el proyecto cloud** / configurar token (project `phcpmgfpuobeyptbbgcy`; backup usa Management API con PAT)
- [x] Definir ubicación: script en `scripts/backup-supabase/` + cron diario 12:00 con reintento que cubre el sábado

---

## 🏁 Definition of Done (DoD)

- [ ] Migración inicial cloud → local exitosa
- [ ] Script de backup local → cloud funcionando (schema + datos + auth + storage)
- [ ] Cron semanal (sábados) configurado y verificado al menos 1 corrida
- [ ] Restauración de prueba verificada desde el cloud
- [ ] Logs / verificación de integridad de los datos
- [ ] Código documentado y agregado al repo
- [ ] ✅ Marcada como completada en `docs/stories/INDEX.md`

---

## 📎 Documentación Relacionada

- [docs/DATABASE_SETUP.md](./../DATABASE_SETUP.md)
- [docs/SECRETS_ARCHITECTURE.md](./../SECRETS_ARCHITECTURE.md)
- [US-001 — Levantar servidor local](./US-001-levantar-servidor-local.md)

## 📝 Progreso (2026-08-19)
- Migración inicial cloud → local: ✅ (7 projects, 18 secrets, 28 activity, 3 ai_keys, 1 pref; user_id remapeado).
- Backup local → cloud (`backup.py` vía Management API/PAT): ✅ verificado (cloud íntegro, user_id remapeados).
- Lógica de reintento en `run.sh`: ✅.
- Cron semanal: ⏳ pendiente de instalar en el host (el entorno no puede escribir `crontab`; requiere corrida manual del usuario).
- Restauración de prueba: parcial (verificada integridad del cloud post-backup).
