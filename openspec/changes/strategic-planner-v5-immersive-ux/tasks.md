# Tareas: Immersive Temporal Canvas (V5)

> **Estado**: ✅ COMPLETO — Fases 1, 2 y 3 implementadas. 60/60 tests · Build ✓

## ✅ Fase 1: Backend Data Model
- [x] **[models.py]**: `scheduled_time` (Time), `is_manual` (Boolean), `BatchStatus.MANUAL_DRAFT`
- [x] **[schemas.py]**: `StrategicPostRead` + `ManualDraftCreate` + `StrategicPostUpdate`
- [x] **[routes/planner.py]**: `GET /planner/pulse` (entregado en V4), `POST /planner/manual-draft`, `PATCH /planner/posts/{id}`, `DELETE /planner/posts/{id}`
- [x] **[alembic]**: Migración `c3d4e5f6a7b8` aplicada en DB

## ✅ Fase 2: El Escritorio de Mando (Calendario V5)
- [x] **[CalendarView.jsx]**: `PostMicroCard` chips en celdas (SEÑAL mode), event pills en MAPA (sin cambios)
- [x] **[CalendarView.jsx]**: Toggle `MES | SEMANA` funcional con navegación por semana/mes
- [x] **[PostDetailModal.jsx]**: Modal completo (concept, caption, schedule, platform, Eliminar/Guardar/Aprobar)
- [x] **[CalendarView.jsx]**: Botón `+` por celda (hover), llama `onAddPost(dateStr)`

## ✅ Fase 3: Interacción & Telemetría
- [x] **[Planner.jsx]**: `modalState` + handlers para crear/editar/eliminar posts desde el calendario
- [x] **[EventQuickAdd.jsx]**: Input lenguaje natural → `eventsAPI.interpret` → feedback inline
- [x] **[Pulse]**: `PulseWidget` en header (entregado en V4, conectado aquí)

## ✅ QA & Validación
- [x] **[TDD]**: `test_v5_schedules.py` — 8 tests (TDD-004 Schedules + TDD-005 Manual flag)
- [x] **[Docker]**: `vite build` ✓ 0 errores · 60/60 unit tests passing
