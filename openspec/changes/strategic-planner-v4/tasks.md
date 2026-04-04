# Tareas: Strategic Command Center (V4)

## ✅ Fase 1: Backend Foundations (Arquitectura Corregida por Antigravity)
1. [x] **[models.py]** — Refactor a `StrategicPost`: `caption` nullable, añadidos `concept_title` y `narrative_goal`.
2. [x] **[schemas.py]** — Actualizado `StrategicPostRead` para soportar flujos de solo-idea.
3. [x] **[TDD]** — Test `tests/unit/test_strategic_concepts.py` CREADO y VALIDADO.
4. [ ] **[alembic]** — Generar migración real para impactar estos cambios en la DB (Falta ejecutar `alembic revision --autogenerate`).

## 🧠 Fase 2: Strategist Agent (Ideación de Conceptos) - PENDIENTE CORRECCIÓN CLAUDE
5. [ ] **[services/ai/ai_planner.py]** — **CORREGIR**: Debe generar `concept_title` y `narrative_goal`. No debe redactar captions en esta fase.
6. [ ] **[api/routes/planner.py]** — **CORREGIR**: `GET /planner/generate` debe devolver solo conceptos.
7. [ ] **[api/routes/planner.py]** — **NUEVO**: `POST /planner/generate-signals` para redactar captions a partir de conceptos aprobados.

## 🎨 Fase 3: Command Center UI (Las 4 Vistas) - PENDIENTE CORRECCIÓN CLAUDE
8. [ ] **[pages/Planner.jsx]** — **CORREGIR**: Añadir switch `MODO ESTRATEGIA | MODO PRODUCCIÓN`.
9. [ ] **[components/CalendarFullView.jsx]** — Soporte para ver "Bloques de Concepto" (Fase 1) vs "Posts Reales" (Fase 2).
10. [ ] **[components/BatchReview.jsx]** — Renderizar "Cards de Concepto" (Idea + Objetivo) en lugar de captions.

## 🔄 Fase 4: Bucle ADN & Telemetría
11. [ ] **[Pulse]**: Integrar visualización de Confianza de ADN en el header del Planner.
12. [ ] **[Learning]**: Implementar el disparador de aprendizaje tras rechazo de un concepto estratégico.
