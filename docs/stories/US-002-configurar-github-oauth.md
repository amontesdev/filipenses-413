# US-002 — Configurar GitHub OAuth para auth local

## 📋 Información General

| Campo | Valor |
|-------|-------|
| **ID** | `US-002` |
| **Título** | Configurar GitHub OAuth para auth local |
| **Rol afectado** | `dev` |
| **Prioridad** | `media` |
| **Dependencias** | US-001 |
| **Estado** | `en progreso` |

---

## 🎯 Descripción

> **Como** usuario de la app
> **Quiero** poder iniciar sesión con GitHub en el entorno local
> **Para** probar el flujo completo de auth sin depender de un proyecto en la nube

### Contexto adicional

La app usa GitHub como único proveedor de auth (ver `docs/AUTH_SETUP.md`). En local,
Supabase necesita un OAuth App de GitHub con callback apuntando a
`http://localhost:3001/auth/callback` y las credenciales configuradas en
`supabase/config.toml` (`[auth.external.github]`).

---

## 🟢 Happy Path

1. Crear un GitHub OAuth App (Settings → Developer settings → OAuth Apps).
2. Configurar callback URL: `http://localhost:3001/auth/callback`.
3. Poner `client_id` y `secret` en `supabase/config.toml` → `[auth.external.github]`.
4. Reiniciar auth: `supabase stop && supabase start` (o `supabase restart`).
5. Probar login en `http://localhost:3001/login`.

---

## ⚠️ Edge Cases

### Edge Case 1: Callback redirect no coincide

**Resultado esperado:** El puerto en la URL de callback debe ser `3001` (no el default 3000);
verificar también `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` en `.env.local`.

---

## ✅ Definition of Ready (DoR)

- [ ] Descripción y happy path validados
- [ ] Se tiene acceso a crear OAuth Apps en GitHub

---

## 🏁 Definition of Done (DoD)

- [ ] Login con GitHub funciona contra Supabase local
- [ ] El flujo de callback crea el perfil en `public.profiles`
- [ ] Documentado en `docs/stories/INDEX.md` como completada

---

## 📝 Notas (2026-08-18)

- **Provider habilitado** con Client ID real + secret via env var (`SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET`).
- **external_url** = `http://100.109.82.30:64321/auth/v1` → redirect_uri correcta por Tailscale.
- El authorize redirige a GitHub con callback coincidente. Falta confirmar login end-to-end.
- ⚠️ El secret se pasa por env var al correr `supabase start` — en cada reinicio hay que volver a pasarla.
