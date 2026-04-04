# Tareas: Rediseño Perfil & IA Config (V2.0)
> **Estado:** ✅ ARCHIVADO — Ver `archived/completed_2026-04-03.md` para el detalle completo.


## ✅ Fase 1: Backend / DB (Alembic & TDD)
1.  [x] **Test TDD:** Crear tests unitarios en `tests/unit/test_models.py` para los nuevos campos de la entidad.
2.  [x] **Migración de DB:** Crear script de Alembic para añadir `audience_age_min`, `audience_age_max`, `audience_country`, `audience_province` y `use_regional_slang` a la tabla `bands` (como entidad base).
3.  [x] **Modelos Update:** Actualizar la clase `Band` en `models.py` (tratada como Entidad Artística).
4.  [x] **Schemas Update:** Actualizar schemas Pydantic.

## 🛠️ Fase 2: Identidad & Localización (Frontend)
5.  [x] **Data Constant:** Crear `src/constants/LocationData.js` con el listado de países y subdivisiones.
6.  [x] **Rediseño Perfil (Layout):** Implementar el sistema de solapas (Identidad / IA Config) en `Profile.jsx`.
7.  [x] **Selectores de Edad:** Reemplazar el input de texto por dos `<select>` min/max para audiencia.
8.  [x] **Selector de Localización:** Implementar los dos `<select>` dependientes (País -> Provincia).
9.  [x] **Voz y Modismos:** Añadir el toggle/checkbox para `use_regional_slang` en la sección de audiencia.

## 🛠️ Fase 3: IA Config & Soporte UI (Frontend)
10. [x] **Help Component:** Crear `HelpTooltip.jsx` con iconos de `Info` y textos explicativos (no técnicos).
11. [x] **IA Section Redesign:** Refactorizar el motor de IA para agrupar (Match Rate, Config, Frecuencia) en la nueva pestaña.
12. [x] **Contextual Help Icon:** Añadir los iconos de ayuda al lado de cada título de sección.

## 🛠️ Fase 4: Signal Nodes & Redes (Frontend)
13. [x] **Fix Social Connect:** Revisar y reparar el flujo de conexión (selection bug) de redes sociales.
14. [x] **Nuevas Redes:** Añadir Facebook y YouTube como opciones conectables (logos y estados UI).
15. [x] **Pop-up de Confirmación:** Implementar el modal de confirmation para eliminar redes conectadas.

## 🧪 Fase 5: Validación Full (Unit, Security, E2E)
16. [x] **TDD / Unit Tests:** Ejecutar toda la suite de tests del backend asegurando regresión cero.
17. [x] **Security Audit:** Auditar que los campos de localización y slang no permitan inyecciones o fugas de datos.
18. [x] **E2E Playwright:** Implementar test E2E en `frontend/e2e/profile.spec.js` cubriendo: navegación de tabs, selectores de edad (min/max), selectores dependientes País→Provincia, toggle de modismos, modal de confirmación de desconexión de redes, flujo editar/guardar/cancelar.
19. [x] **Pruebas de Redes:** Verificar que el pop-up de borrado funcione y no rompa el estado global.
