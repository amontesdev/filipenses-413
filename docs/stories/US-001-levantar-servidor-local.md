# US-001 — Levantar servidor local (Supabase CLI + Postgres, puerto 3001)

## 📋 Información General

| Campo | Valor |
|-------|-------|
| **ID** | `US-001` |
| **Título** | Levantar servidor local con Supabase CLI + Postgres en puerto 3001 |
| **Rol afectado** | `dev` |
| **Prioridad** | `alta` |
| **Dependencias** | Ninguna |
| **Estado** | `completada` |

---

## 🎯 Descripción

> **Como** desarrollador del proyecto
> **Quiero** levantar el entorno de desarrollo local completo (app Next.js + Supabase local con Postgres)
> **Para** poder desarrollar y probar features sin depender de un proyecto Supabase en la nube

### Contexto adicional

El proyecto usa Supabase para auth, base de datos y storage. Para desarrollo local se usa la
CLI de Supabase (`supabase start`), que levanta Postgres y todos los servicios (Auth, REST,
Storage, Realtime, Studio) vía Docker.

La app Next.js debe correr en el **puerto 3001** (el 3000 queda libre para otros proyectos).

---

## 🟢 Happy Path

1. **Preparar Docker** — Docker Desktop corriendo en la máquina.
2. **Inicializar Supabase** — `supabase init` crea `supabase/config.toml`.
3. **Configurar puertos** — Ajustar los puertos en `config.toml` para no chocar con otros
   stacks locales (serie `64xxx`: API 64321, DB 64322, Studio 64323, etc.).
4. **Levantar el stack** — `supabase start` descarga imágenes y arranca Postgres + servicios.
5. **Aplicar esquema** — Ejecutar los scripts `scripts/0XX_*.sql` en orden contra la DB local.
6. **Configurar variables** — Crear `.env.local` con la URL/keys de Supabase local y un
   `ENCRYPTION_KEY` de 32 bytes en base64.
7. **Instalar dependencias** — `pnpm install`.
8. **Levantar la app** — `next dev -p 3001` y abrir `http://localhost:3001`.

---

## ⚠️ Edge Cases

### Edge Case 1: Puerto ocupado por otro stack Supabase

**Escenario:** Ya existe otro proyecto Supabase local corriendo (ej: safedoor-qr) en los
puertos 54321-54327.

**Resultado esperado:** El `config.toml` de este proyecto usa puertos alternativos (64xxx)
para que ambos stacks convivan sin conflicto.

### Edge Case 2: Docker no está corriendo

**Escenario:** `supabase start` falla porque el daemon de Docker no responde.

**Resultado esperado:** Mensaje claro indicando que hay que iniciar Docker Desktop primero;
el comando se puede reintentar una vez Docker esté activo.

### Edge Case 3: Falta `ENCRYPTION_KEY` válida

**Escenario:** La app arranca pero el cifrado de secrets falla o la key no tiene 32 bytes.

**Resultado esperado:** La variable está documentada en `.env.example`; generar con
`openssl rand -base64 32` y validar al arrancar.

---

## ✅ Definition of Ready (DoR)

- [x] La descripción y el happy path están claros y validados
- [x] Los edge cases están identificados
- [x] Las dependencias están resueltas (ninguna)
- [x] Los criterios de aceptación están definidos en la DoD

---

## 🏁 Definition of Done (DoD)

- [x] `supabase start` levanta Postgres y servicios sin errores
- [x] Los scripts SQL del esquema están aplicados en la DB local
- [x] `.env.local` configurado con credenciales locales
- [x] La app corre en `http://localhost:3001` y responde
- [x] Login/registro funcionan contra Supabase local *(auth service OK; OAuth de GitHub pendiente → US-002)*
- [x] Documentado en `docs/stories/INDEX.md` como completada

---

## 📎 Documentación Relacionada

- [Database Setup](../DATABASE_SETUP.md)
- [Auth Setup](../AUTH_SETUP.md)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## 📝 Notas de implementación (2026-08-18)

- **Puertos:** se usa la serie `64xxx` para convivir con safedoor-qr (54321-54327):
  API `64321`, DB `64322`, Studio `64323`, Mailpit `64324`, Pooler `64329`.
- **Analytics desactivado** (`[analytics] enabled = false`) por limitación de RAM
  (la máquina tiene 8 GB y safedoor ya usa ~2 GB).
- **pnpm:** se activó vía corepack (v11.22.0). Se creó `pnpm-workspace.yaml` con
  `allowBuilds: sharp: false` (la app usa `images.unoptimized`, sharp no es necesario).
- **Script dev:** `next dev -p 3001` (actualizado en `package.json`).
- **Esquema:** scripts `000`–`009` aplicados contra la DB local. Tablas creadas:
  `profiles`, `projects`, `secrets`, `activity_logs`, `user_ai_keys`, `user_ai_preferences`.
- **Pendiente:** GitHub OAuth para login real → ver US-002.
