# strategic-planner-v4 — COMPLETADO

**Fecha de cierre:** 2026-04-03
**Estado:** ✅ Todas las fases implementadas y archivadas.

## Resumen de entregas

### Backend
- Modelos: `EcosystemEvent`, `StrategicBatch`, `StrategicPost` + enums (`EventCategory`, `BatchStatus`, `BatchTimeframe`)
- Migración Alembic: `a1b2c3d4e5f6_add_strategic_planner_tables`
- Rutas: `/api/v1/events/` (CRUD + `/interpret`) y `/api/v1/planner/` (generate, approve-batch, refine-post)
- Servicios AI: `MockAIPlanner` / `TogetherAIPlanner` con factory `get_ai_planner()`
- Servicios AI: `MockEventInterpreter` / `TogetherEventInterpreter` con factory `get_event_interpreter()`

### Frontend
- `pages/Planner.jsx` — hub completo con vista calendario/lista, control bar, batch review
- `components/CalendarView.jsx` — grid mensual con markers por categoría
- `components/EventList.jsx` — lista con formulario inline add/delete
- `components/BatchReview.jsx` — cards con approve/refine/reject + "Aprobar Batch"
- `components/StrategistAssistant.jsx` — chat sidebar con chips de eventos detectados
- `components/PlatformSelector.jsx` — toggle multi-plataforma (IG/FB/YT/TikTok)
- `services/api.js` — `eventsAPI` y `plannerAPI`
- `pages/Dashboard.jsx` — widget "Próximo Evento Estratégico"
- `App.jsx` + `Layout.jsx` — ruta y nav item registrados

### Tests
- `tests/unit/test_planner.py` — 11 unit tests (MockAIPlanner + MockEventInterpreter)

## Bugs resueltos durante implementación
- `Profile.jsx`: tag `<form>` duplicado causaba fallo de build en Docker
- `StrategicPost.variants`: relación auto-referencial SQLAlchemy con dirección ambigua → removida, FK mantenida en DB para Phase 5 futura
