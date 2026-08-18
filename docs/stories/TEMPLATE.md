# Plantilla de User Story

> **Instrucciones:** Copia este archivo como `NOMBRE-DE-LA-STORY.md` y completa cada sección.
> Al finalizar el desarrollo, marca como completado actualizando el `STATUS` en el INDEX.md.

---

## 📋 Información General

| Campo | Valor |
|-------|-------|
| **ID** | `US-XXX` (auto-incremental) |
| **Título** | Breve nombre de la story |
| **Rol afectado** | `super_admin` / `admin` / `guard` / `parent` |
| **Prioridad** | `alta` / `media` / `baja` |
| **Dependencias** | IDs de stories de las que depende |
| **Estado** | `pendiente` / `en progreso` / `completada` |

---

## 🎯 Descripción

> **Como** [rol del usuario]
> **Quiero** [acción/feature]
> **Para** [beneficio/razón]

### Contexto adicional
_Explica el contexto, el problema que resuelve, pantallas afectadas, etc._

---

## 🟢 Happy Path

_El flujo ideal paso a paso desde que el usuario inicia hasta que completa la acción exitosamente._

1. **Paso 1** — Descripción
2. **Paso 2** — Descripción
3. **Paso 3** — Descripción
4. **Paso 4** — Descripción

---

## ⚠️ Edge Cases

_Casos límite o inesperados que deben ser manejados (mínimo 2)._

### Edge Case 1: Título del caso

**Escenario:** _Descripción del escenario_

**Resultado esperado:** _Comportamiento esperado del sistema_

### Edge Case 2: Título del caso

**Escenario:** _Descripción del escenario_

**Resultado esperado:** _Comportamiento esperado del sistema_

### Edge Case 3 (opcional): Título del caso

**Escenario:** _Descripción del escenario_

**Resultado esperado:** _Comportamiento esperado del sistema_

---

## ✅ Definition of Ready (DoR)

_Condiciones que deben cumplirse ANTES de empezar a implementar:_

- [ ] La descripción y el happy path están claros y validados
- [ ] Los edge cases están identificados
- [ ] Las dependencias están resueltas (si aplica)
- [ ] Los criterios de aceptación están definidos en la DoD

---

## 🏁 Definition of Done (DoD)

_Condiciones que deben cumplirse PARA DAR POR TERMINADA la story:_

- [ ] Código implementado siguiendo los estándares del proyecto
- [ ] Tests unitarios (TDD, patrón AAA) implementados y pasando
- [ ] Tests E2E (Playwright) implementados y pasando
- [ ] Diagrama de flujo actualizado
- [ ] Documentación de contexto generada/actualizada
- [ ] Código revisado (code review)
- [ ] Feature desplegada en ambiente de pruebas
- [ ] ✅ **Marcada como completada en `INDEX.md`**

---

## 📎 Documentación Relacionada

- [Diagrama de flujo](link-al-diagrama)
- [Documentación de contexto](link-a-docs)
- [Tests](link-a-tests)
