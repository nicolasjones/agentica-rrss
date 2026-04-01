# OpenSpec: Tasks & Backlog (Full System)
> **Última actualización:** 2026-03-30 | Versión: 2.1.0

Este documento lista el backlog de tareas pendientes y los mandatos de mantenimiento del sistema.

---

## ✅ Completado (Implementado en Producción)

### Sistema Base
- [x] Autenticación JWT (signup, login, auto-logout en 401)
- [x] Modelo de datos completo (`bands`, `networks`, `generated_posts`, `content_patterns`, `learning_log`, `campaigns`, `generative_feedbacks`, `band_profile_evolution`, `band_members`, `band_contexts`, `visual_styles`)
- [x] Containerización Docker completa (db, redis, rabbitmq, api, worker, beat, frontend)

### Multi-Proyecto Workspace
- [x] `GET /api/v1/bands/overview` — Resumen multi-ecosistema
- [x] `GET /api/v1/analytics/aggregate` — Métricas combinadas
- [x] `ProjectsOverview.jsx` — Pantalla "Mis Ecosistemas" con cards y stats
- [x] `ActiveProjectContext` — Contexto global persistido en `localStorage`
- [x] Sidebar actualizado con selector de proyecto

### Perfil & ADN (Motor de Identidad)
- [x] Edit Mode: perfil protegido con doble confirmación para editar
- [x] Selector de Rol (Cantante, Sello, DJ, Manager, etc.)
- [x] Selector de Géneros multi-chip (máx. 10)
- [x] TagSelector de Tono de Voz (máx. 3, contador X/3 live)
- [x] TagSelector de Valores Core (máx. 3, contador X/3 live)
- [x] Custom Tags (añadir con Enter en campo libre)
- [x] Audiencia: Age Range + Location
- [x] Config IA: Toggle auto-publish + Slider posts-per-day
- [x] `DELETE /api/v1/networks/{id}` con Hard-Reset de ContentPosts
- [x] Modal de conexión de red con deduplicación (previene duplicados)
- [x] Escaneo Manual por nodo con estado de carga animado
- [x] Desconexión de red con confirmación de 2 pasos

---

## 🔄 Backlog de Tareas (Próximo Sprint)

### Backend & IA
- [ ] **[TASK-01]** Automatizar el entrenamiento semántico del `band_profile_vector` basado en `LearningLog` acumulado (tarea Celery periódica).
- [ ] **[TASK-02]** Validar límites de tags (máx. 3) en el backend (Pydantic validator en `BandUpdate`).
- [ ] **[TASK-03]** Implementar generación real de posts vía LLM para el Post Lab (actualmente usa mock).
- [ ] **[TASK-04]** Integrar Webhooks reales para plataformas sociales y salir del modo Mock de OAuth.

### Features
- [ ] **[TASK-05]** "Dry Run" de generación: previsualizar el impacto del ADN antes de guardar cambios en perfil.
- [ ] **[TASK-06]** Portal de Admin (SuperUser) para gestionar etiquetas globales `MasterData` (Roles, Tonalidades, Valores disponibles en el sistema).
- [ ] **[TASK-07]** Visual Director: Controles de configuración de estilo visual (Agresión, Glitched, Contraste) para el Director de Arte.
- [ ] **[TASK-08]** Community Agent: Revisión y aprobación de respuestas a DMs y comentarios (tablas `interaction_responses` ya existen).

### Calidad & Infraestructura
- [ ] **[TASK-09]** Tests de regresión: `backend/tests/test_profile_regression.py` para ADN + redes + Post Lab.
- [ ] **[TASK-10]** Tests Playwright E2E para flujos críticos: Login → Crear Ecosistema → Editar ADN → Conectar Red.
- [ ] **[TASK-11]** Implementar refresh automático de tokens OAuth antes de su expiración.

---

## 🛡️ Mandatos de Seguridad (Invariables)

1. **Límites de ADN Son Sagrados**: Máximo **3 etiquetas** de Tono o Valores. Máximo **10 géneros**. No se puede modificar sin actualizar esta especificación.
2. **Hard-Reset en Desconexión**: `DELETE /networks/{id}` SIEMPRE debe limpiar `ContentPosts` asociados. No hay excepciones.
3. **Ownership Check**: Toda operación sobre un ecosistema DEBE pasar por `_verify_band_ownership()`.
4. **Edit Mode**: El perfil de ADN NUNCA puede editarse sin activación explícita del botón "EDITAR ADN".

---
*Este documento es dinámico y debe actualizarse en cada sprint. Versión 2.1.0 refleja el estado al 30-03-2026.*
