# OpenSpec: Change — Multi-Project Workspace Management
> **Estado:** ✅ ARCHIVADO — Completado el 2026-03-30
> **Versión del Sistema al archivar:** 2.1.0

---

## 🎯 Objetivo del Change
Transición de la plataforma Agenmatica desde un modelo single-band a un **sistema de gestión multi-proyecto** donde un usuario puede administrar múltiples ecosistemas de identidad digital de forma independiente.

## ✅ Tareas Completadas

### Fase 1: Backend & Métricas Agregadas
- [x] **[TASK-01]** `GET /api/v1/analytics/aggregate` — Suma seguidores y engagement de todos los ecosistemas del usuario.
- [x] **[TASK-02]** `GET /api/v1/bands/overview` — Resumen rápido multi-ecosistema (ID, Nombre, Seguidores, Posts Pendientes).

### Fase 2: Pantalla "Mis Ecosistemas"
- [x] **[TASK-03]** `ProjectsOverview.jsx` — Página inicial post-login con grid de cards de ecosistemas.
- [x] **[TASK-04]** Header de "Rendimiento Combinado" con 4 KPIs: Audiencia Total, Nodos Activos, Confianza ADN Avg, Engagement Total.

### Fase 3: Navegación & Estado Global
- [x] **[TASK-05]** `ActiveProjectContext.jsx` — Contexto React persistido en `localStorage` para mantener el ecosistema activo.
- [x] **[TASK-06]** Sidebar/Layout actualizado con botón "← Mis Ecosistemas" y nombre del proyecto activo.
- [x] **[TASK-07]** Dashboard, Post Lab, Analytics y Perfil filtran datos por `activeBandId`.

### Fase 4: Calidad & Regresión
- [x] **[TASK-08]** Health Checks ejecutados. Perfiles y ADN funcionan correctamente en modo multi-proyecto.
- [x] **[TASK-09]** Logout limpia `activeBandId` del `localStorage`.

### Fase 5: Perfil & ADN (Completado en sesión 2026-03-30)
> Funcionalidades adicionales implementadas durante la estabilización del sistema:
- [x] Edit Mode de seguridad (solo lectura por defecto)
- [x] Selector de Rol, Géneros multi-chip, TagSelector Tono & Valores (máx. 3), Custom Tags
- [x] Audiencia (Age Range + Location), Config IA (auto-publish, posts/day)
- [x] `DELETE /api/v1/networks/{id}` con Hard-Reset
- [x] Modal de conexión con prevención de duplicados
- [x] Escaneo manual por nodo + Desconexión con confirmación

## 📦 Archivos Modificados
- `backend/app/api/routes/networks.py` — Nuevo `DELETE /{network_id}`
- `frontend/src/services/api.js` — `networksAPI.disconnect()`
- `frontend/src/pages/Profile.jsx` — Reescritura completa
- `frontend/src/pages/ProjectsOverview.jsx` — Creado
- `frontend/src/context/ActiveProjectContext.jsx` — Creado
- `openspec/system_spec/spec.md` — Actualizado a v2.1.0
- `openspec/system_spec/design.md` — Actualizado a v2.1.0
- `openspec/system_spec/proposal.md` — Actualizado a v2.1.0
- `openspec/system_spec/tasks.md` — Actualizado a v2.1.0
