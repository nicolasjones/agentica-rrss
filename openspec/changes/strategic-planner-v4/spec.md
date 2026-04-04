# Especificación Técnica: Strategic Command Center (V4)

**ID**: `strategic-planner-v4`
**Estado**: ✅ IMPLEMENTADO — 2026-04-03

---

## 1. Requerimientos Funcionales

### 1.1 Gestión de Ecosistema de Eventos (`/events`)

| Operación | Endpoint | Descripción |
|-----------|----------|-------------|
| Listar | `GET /api/v1/events/?band_id=` | Todos los eventos del proyecto ordenados por fecha |
| Crear | `POST /api/v1/events/?band_id=` | Crear evento manualmente |
| Eliminar | `DELETE /api/v1/events/{event_id}` | Eliminar evento (cascade a StrategicPost asociados) |
| Interpretar | `POST /api/v1/events/interpret?band_id=` | AI chat-to-event: recibe texto libre, retorna eventos sugeridos (no persistidos) |

**Categorías de evento**: `GIG` · `LAUNCH` · `BTS` · `ANNOUNCEMENT` · `OTHER`

**Flujo de interpretación AI**:
1. Frontend envía el mensaje del usuario al endpoint `/interpret`.
2. El backend llama al `EventInterpreter` (mock o Together.ai según `MOCK_LLM`).
3. Se devuelve `{ reply: str, events: [EcosystemEventCreate] }` — aún no persistidos.
4. El frontend muestra `EventChip` por cada evento detectado.
5. El usuario confirma chip a chip → `POST /events/` por cada uno confirmado.

### 1.2 Pipeline de Generación de Batch (`/planner`)

| Operación | Endpoint | Descripción |
|-----------|----------|-------------|
| Listar batches | `GET /api/v1/planner/batches?band_id=` | Historial de batches del proyecto |
| Generar | `GET /api/v1/planner/generate?band_id=&timeframe=` | Lanza el Strategist Agent y persiste un nuevo `StrategicBatch` en estado `PROPOSED` |
| Aprobar batch | `POST /api/v1/planner/approve-batch?batch_id=` | Promueve posts con `is_approved=True` a la tabla `generated_posts`; marca batch como `ACCEPTED` |
| Refinar post | `POST /api/v1/planner/refine-post?band_id=` | Regenera un `StrategicPost` individual con feedback del usuario |

**Timeframes soportados**: `weekly` (7d) · `biweekly` (14d) · `monthly` (30d)

**Flujo de aprobación**:
1. El artista genera un batch → status `PROPOSED`.
2. Revisa post a post: aprueba (toggle `is_approved`), refina (feedback + regeneración), o rechaza (remove from UI).
3. Hace click en "Aprobar Batch" → los posts con `is_approved=True` se copian como `GeneratedPost` → disponibles en Post Lab.
4. El batch pasa a status `ACCEPTED`.

### 1.3 Asistente Conversacional (StrategistAssistant)

- Sidebar colapsable activado desde el control bar de Planner.
- Chips de sugerencia rápida para frases comunes.
- Historial de mensajes en sesión (no persistido en DB).
- Detección AI de fechas y categorías de eventos en lenguaje natural en español.

### 1.4 Widget Dashboard — Próximo Evento Estratégico

- Se muestra entre la sección de "Momentum Feed" y "Signal Chain Board".
- Carga los eventos del proyecto al iniciar el Dashboard.
- Muestra el evento más próximo (fecha >= hoy) con título, fecha y categoría.
- Link directo a `/planner`.
- Si no hay eventos: el widget no se renderiza.

---

## 2. Requerimientos No Funcionales

- **Modo mock**: `MOCK_LLM=true` activa `MockAIPlanner` y `MockEventInterpreter` sin consumir API keys.
- **Autenticación**: todos los endpoints requieren JWT. Los endpoints de planner validan que el `band_id` pertenezca al usuario autenticado.
- **Sin bloqueo de UI**: la generación de batch es síncrona en backend pero el frontend muestra spinner durante la espera; la experiencia no bloquea navegación.
- **Integridad referencial**: eliminar un `EcosystemEvent` aplica cascade sobre sus `StrategicPost` asociados.

---

## 3. Restricciones

- La relación auto-referencial `StrategicPost.variants` (posts variantes de un mismo concepto) fue diseñada pero **diferida a V5** por complejidad de configuración SQLAlchemy. La FK `parent_post_id` existe en DB para uso futuro.
- El Asistente no persiste el historial de chat entre sesiones.
- La selección de plataformas en el control bar de Planner es UI-only en V4 (no filtra la generación del batch en el backend aún).
