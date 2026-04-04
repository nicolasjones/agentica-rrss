# Tareas: Strategic Command Center (V4)
> **Estado:** ✅ COMPLETO — Fases 1, 2 y 3 implementadas. Ver lecciones en `openspec/knowledge/lessons.md`.

---

## ✅ Fase 1: Backend Foundations

1. [x] **[models.py]** — `StrategicPost` refactorizado: `caption` nullable, `concept_title` y `narrative_goal` agregados.
2. [x] **[schemas.py]** — `StrategicPostRead` soporta flujo concepto-primero (todos los campos opcionales correctamente).
3. [x] **[TDD]** — `tests/unit/test_strategic_concepts.py` — 9 tests del pipeline de dos fases.
4. [x] **[alembic]** — Migración `b2c3d4e5f6a7`: `concept_title`, `narrative_goal`, `caption nullable`. Aplicada en DB ✅

---

## ✅ Fase 2: Strategist Agent (Pipeline MAPA → SEÑAL)

5. [x] **[services/ai/ai_planner.py]** — `generate_batch()` devuelve solo conceptos (`caption=None`). `generate_signals()` genera captions para conceptos aprobados. Factory `get_ai_planner()`.
6. [x] **[api/routes/planner.py]** — `GET /planner/generate` → MAPA (conceptos). `POST /planner/generate-signals` → SEÑAL (captions). `POST /planner/approve-batch` → publicar a GeneratedPost.

---

## ✅ Fase 3: Command Center UI (Las 4 Vistas)

7. [x] **[pages/Planner.jsx]** — Switch `MAPA | SEÑAL`, state `batchMode`, handler `handleGenerateSignals`.
8. [x] **[components/CalendarView.jsx]** — Modo strategy: markers de eventos. Modo production: dots de posts por plataforma. Badge MAPA/SEÑAL en header.
9. [x] **[components/BatchReview.jsx]** — `ConceptCard` (Idea + Objetivo) en MAPA. `SignalCard` (caption + refinar) en SEÑAL. Footer contextual por modo.
10. [x] **[services/api.js]** — `plannerAPI.generateSignals(batchId, bandId)`.

---

## ✅ Fase 4: Bucle ADN & Telemetría

11. [x] **[Pulse]** — `GET /planner/pulse` + `PulseWidget.jsx` en header del Planner. Muestra confidence_score, regional_sync y active_nodes (top-5 ContentPatterns).
12. [x] **[Learning]** — `POST /planner/reject-concept` crea `LearningLog(POST_REJECTED)` al rechazar un concepto. Fire-and-forget desde handleRejectPost.

---

## ⚠️ Deuda Técnica

- `parent_post_id` FK existe en DB para variantes de posts; relación ORM diferida a V5.
- `PlatformSelector` es UI-only en V4; filtro en `/generate` pendiente para V5.
- Historial de chat del Asistente no persiste entre sesiones.
- `Base.metadata.create_all()` en startup crea tablas directamente, adelantando el estado de Alembic. Mitigar en V5 usando solo migraciones explícitas.
