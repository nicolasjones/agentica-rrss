# Lecciones Aprendidas — Agenmatica

> Registro acumulativo de aprendizajes por fase y feature. Actualizar al cerrar cada fase.
> Formato: Lección → Por qué importa → Cómo aplicar.

---

## Strategic Planner V4 — Fase 1 & 2: Integración DB/Alembic

**Fecha**: 2026-04-04

### L0 — Base.metadata.create_all adelanta el tracker de Alembic
**Qué pasó**: El backend usa `Base.metadata.create_all()` en startup para crear tablas automáticamente. Cuando Alembic intenta correr la migración `a1b2c3d4e5f6`, los enums y tablas ya existen en PostgreSQL → `DuplicateObjectError: type "eventcategory" already exists`.
**Por qué importa**: El historial de versiones de Alembic queda desfasado de la DB real. Alembic cree estar en rev `5600a3685d5e` pero la DB tiene tablas de `a1b2c3d4e5f6`.
**Cómo aplicar**: Usar `alembic stamp <rev>` para sincronizar el tracker sin re-ejecutar DDL. En producción, deshabilitar `create_all` y confiar 100% en Alembic. El `create_all` solo es seguro en entornos de test con DB descartable.

---

## Strategic Planner V4 — Fase 1: Backend Foundations

**Fecha**: 2026-04-03

### L1 — SQLAlchemy auto-referential self-join
**Qué pasó**: La relación `StrategicPost.variants` (post padre ↔ variantes) generó `ArgumentError: both of the same direction ONETOMANY`. SQLAlchemy no puede inferir la dirección cuando FK y target son la misma tabla.
**Por qué importa**: Bloquea el startup completo de la API (mapper config falla en import time).
**Cómo aplicar**: Para self-referential ORM relationships usar siempre `foreign_keys=[ColumnFK]` explícito. Diferir si agrega riesgo sin valor inmediato. La FK en DB puede existir sin la relación ORM.

### L2 — Migraciones manuales vs autogenerate
**Qué pasó**: `alembic revision --autogenerate` no detecta enums PostgreSQL nativos creados con `op.execute("CREATE TYPE ...")`. El autogenerate solo trackea tablas/columnas.
**Por qué importa**: Si se borra y recrea la DB, los enums deben existir antes que las tablas que los referencian.
**Cómo aplicar**: Para enums PostgreSQL, siempre crearlos al inicio del `upgrade()` y dropearlos al final del `downgrade()`. Usar `IF NOT EXISTS` / `IF EXISTS` para idempotencia.

### L3 — caption NOT NULL en migración original
**Qué pasó**: La migración `a1b2c3d4e5f6` creó `caption` como NOT NULL. Al refactorizar el modelo para soportar el modo concepto (caption=None), fue necesaria una segunda migración `b2c3d4e5f6a7` para ALTER COLUMN.
**Por qué importa**: Cambiar nullable=False a True en producción requiere manejo cuidadoso para no romper datos existentes.
**Cómo aplicar**: Diseñar el schema con la variabilidad futura en mente. En pipelines de dos fases, los campos de "fase 2" deben ser nullable desde el inicio.

---

## Strategic Planner V4 — Fase 2: Strategist Agent

**Fecha**: 2026-04-03

### L4 — Two-phase AI pipeline: Concepts vs Signals
**Qué pasó**: La arquitectura original generaba captions directamente. Antigravity refactorizó para separar ideación (concept_title + narrative_goal) de redacción (caption).
**Por qué importa**: Permite al artista aprobar la *estrategia* antes de comprometerse con el *texto*. Reduce rechazos tardíos de captions cuando la dirección narrativa es incorrecta.
**Cómo aplicar**: Para cualquier pipeline creativo de IA, separar la fase de intención (barata, rápida) de la fase de producción (costosa, lenta). El usuario aprueba en la fase barata.

### L5 — Factory pattern para LLM services
**Qué pasó**: `get_ai_planner()` y `get_event_interpreter()` actúan como factories que devuelven mock o real según `settings.mock_llm`.
**Por qué importa**: Permite desarrollo sin API keys y testing determinista sin mocks complejos de httpx.
**Cómo aplicar**: Todo servicio LLM debe tener su par Mock que respete el mismo contrato de interfaz. El mock debe ser lo suficientemente rico para que los tests unitarios sean significativos (no solo "devuelve algo").

### L6 — _infer_archetype desde concept_title
**Qué pasó**: En `generate_signals()`, el Mock necesita saber qué tipo de caption generar para cada concepto. No puede leer la intención directamente.
**Por qué importa**: El contrato entre Fase 1 y Fase 2 pasa por strings. Si los títulos no son predecibles, el mock no puede inferir el arquetipo.
**Cómo aplicar**: Los `concept_title` deben incluir palabras clave del arquetipo ("Expectativa", "Activación", "Recap", "Identidad"). Documentar este contrato en el schema. En producción, el LLM infiere desde `narrative_goal`, no desde el título.

---

## Profile UX Redesign — Fase 5: E2E Tests

**Fecha**: 2026-04-03

### L7 — Duplicate form tag causa fallo silencioso en esbuild
**Qué pasó**: `Profile.jsx` tenía dos `<form id="adn-form" onSubmit={handleSubmit}>` anidados. esbuild compiló sin error de JS pero el HTML resultante era inválido (form dentro de form). El error apareció como fallo de build en Docker.
**Por qué importa**: Los errores de JSX mal formado pueden pasar validación de TypeScript pero fallar en build o comportarse de forma imprevisible en runtime.
**Cómo aplicar**: Al añadir secciones grandes a componentes con formularios existentes, buscar siempre la apertura `<form` existente antes de añadir una nueva. Playwright habría detectado esto en E2E si el test hubiera intentado hacer submit.

---

## Multi-Project Management — Fase completa

**Fecha**: 2026-03-30

### L8 — ProjectGate guard para proteger rutas multi-tenant
**Qué pasó**: Sin el guard, usuarios podían navegar a rutas de un proyecto sin tener uno activo seleccionado, causando errores de `null` en llamadas a API.
**Por qué importa**: En apps multi-tenant, el contexto activo (activeBandId) debe ser obligatorio antes de renderizar cualquier feature de proyecto.
**Cómo aplicar**: Envolver todas las rutas de proyecto con `<ProjectGate>` que redirige a `/projects` si `activeBandId` es null. No repetir esta verificación dentro de cada página.

---

## Strategic Planner V4 — Fase 4: Bucle ADN & Pulse

**Fecha**: 2026-04-04

### L9 — Fire-and-forget para learning triggers de UI
**Qué pasó**: El rechazo de un concepto dispara `POST /planner/reject-concept` desde `handleRejectPost`. Si ese call falla (red, 404), no debe bloquear la UI — el artista ya rechazó el post localmente.
**Por qué importa**: Los errores de telemetría no deben degradar la experiencia principal de edición.
**Cómo aplicar**: Usar `.catch(() => {})` para side-effects de aprendizaje que no son críticos para el flujo. Loguear en consola si se quiere visibilidad, pero no propagar el error al usuario.

### L10 — Pulse como snapshot estático, no tiempo real
**Qué pasó**: El widget Pulse se carga una vez en `init()` junto con eventos y batches. No tiene polling.
**Por qué importa**: El `confidence_score` del ADN cambia lentamente (tras análisis de engagement). Pollear cada segundo sería gasto de tokens y red sin valor.
**Cómo aplicar**: Para métricas de ADN que evolucionan por sesión/día, un fetch al montar el componente es suficiente. Agregar `loadPulse()` tras operaciones que cambian el ADN (approve-batch) si se quiere actualización reactiva.

---

## Patrones Globales

### P1 — OpenSpec workflow: proposal → spec → design → tasks → implement → archive
El flujo de 6 artefactos garantiza que cada feature tenga contexto de negocio (proposal), contrato técnico (spec), arquitectura (design) y progreso rastreable (tasks). Archivar siempre al completar para no contaminar el backlog activo.

### P2 — Mock-first development para servicios externos
Todo servicio externo (LLM, OAuth, analytics) debe tener su implementación mock activable por env var desde el día uno. Permite desarrollo local y CI sin dependencias externas.

### P3 — Cascade delete-orphan en relaciones ORM
Usar `cascade="all, delete-orphan"` en relaciones padre→hijo cuando el hijo no tiene sentido sin el padre (ej: StrategicPost sin StrategicBatch). Previene registros huérfanos en DB.
