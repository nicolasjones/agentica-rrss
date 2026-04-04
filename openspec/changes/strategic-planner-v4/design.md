# Diseño de Sistema: Strategic Command Center (V4)

**ID**: `strategic-planner-v4`
**Estado**: DEFINED (Ready for Implementation)

---

## 1. Modelo de Datos (Refactor V4)

### 1.1 `strategic_posts` (Phase-Aware)
El cambio fundamental es permitir que el post exista como una **Intención (Mapa)** antes de existir como **Contenido (Señal)**.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | Integer PK | autoincrement |
| `batch_id` | Integer FK | NOT NULL |
| `platform` | String(50) | NOT NULL |
| **`concept_title`** | String(255) | **FASE 1**: Título de la idea (ej: "Expectativa single") |
| **`narrative_goal`** | Text | **FASE 1**: Objetivo de la IA (ej: "Generar misterio") |
| **`caption`** | Text | **FASE 2**: Redacción final. **NULLABLE** en Fase 1. |
| `is_approved` | Boolean | TRUE = Idea aceptada, lista para Fase 2. |
| `scheduled_date` | Date | nullable |

---

## 2. API Design (Evolution)

### 2.1 Fase de Ideación (The Map)
- `GET /planner/concepts?band_id&timeframe`:
    - El `AIPlanner` genera una propuesta de **Arquetipos Estratégicos**.
    - Crea registros en `strategic_posts` con `concept_title` y `narrative_goal`. `caption` queda en NULL.
- `POST /planner/concepts/approve`:
    - El usuario aprueba la "Estrategia de la semana".

### 2.2 Fase de Producción (The Signal)
- `POST /planner/signals/generate?batch_id`:
    - Trigger interno que toma los `StrategicPost` aprobados (is_approved=True) y llama al Agente de Redacción.
    - El agente puebla los campos `caption` basándose en el `narrative_goal`.

### 2.3 Telemetría (The Pulse)
- `GET /planner/pulse?band_id`:
    - **Data Output**: `{ confidence_score: float, regional_sync: bool, active_nodes: [] }`.
    - Esta telemetría se muestra en el header del Planner para dar contexto de "mando" al usuario.

---

## 3. Strategist Agent Logic

### 3.1 Nivel I: El Planificador (Strategist)
- **Input**: Eventos (`ecosystem_events`) + ADN de Banda.
- **Output**: Un Batch de conceptos coherentes con el calendario del artista. No redacta textos largos.

### 3.2 Nivel II: El Redactor (Copywriter)
- **Input**: Concepto Aprobado + Tono de Voz + Modismos regionales.
- **Output**: Captions optimizados para cada plataforma (Emoji, Hashtags, CTA).

---

## 4. UI Architecture (4 Perspectives)

1.  **STRATEGY | LIST**: Tabla de conceptos y objetivos.
2.  **STRATEGY | CALENDAR**: Bloques de color representando intenciones narrativas en el tiempo.
3.  **PRODUCTION | LIST**: Post Lab integrado (Edición de captions).
4.  **PRODUCTION | CALENDAR**: Visualización de posts finales con sus iconos de red social.

---

## 5. QA & Security Strategy (Mandatory)

### 5.1 Unit & Integration Tests (Backend)
- **TDD-001 (Security/Multi-tenancy)**: Validar que `StrategicPost` se cree amarrado al `band_id`. Impedir que un `event_id` de la Banda A genere un post en la Banda B.
- **TDD-002 (Consistency)**: Validar que el `StrategicBatch` no pueda tener posts con fechas fuera del `timeframe` solicitado.
- **TDD-003 (Slang Validation)**: Verificar que si `use_regional_slang=True`, el agente de Fase 2 incluya keywords regionales detectadas en el ADN.

### 5.2 E2E Tests (Playwright/Frontend)
- **SCENARIO-001 (Visual Flow)**:
    1.  Cargar ecosistema.
    2.  Arrastrar `EcosystemEvent` al calendario.
    3.  Gatillar "Generar Batch".
    4.  Verificar que aparezcan `is_approved=False` en el Mapa (Ideación).

### 5.3 Performance & Rate Limiting
- **SLA**: El Agente de Ideación debe responder en < 10s para batches de 30 días.
- **Quota**: Limitar la generación de batches a **1 cada 30 segundos** por banda.

### 5.4 Sync & Integration
- Cada tarea debe terminar con un `git commit` atómico.
- Los cambios de backend deben validarse con `docker compose up --build`.
