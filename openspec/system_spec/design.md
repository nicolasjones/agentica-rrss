# OpenSpec: Technical Design (Full System)
> **Última actualización:** 2026-03-30 | Versión: 2.1.0

Este documento detalla la **arquitectura e ingeniería** del sistema Agenmatica en su estado actual de producción.

---

## 🏗️ Arquitectura de la Plataforma

La plataforma se basa en un diseño de **Agentes Desacoplados** que interactúan con un núcleo de datos reactivo.

### 💻 Stack de Ingeniería
| Layer | Tecnología |
|---|---|
| **Frontend SPA** | React 18, Vite, Tailwind CSS (utility-first), Lucide Icons |
| **Routing** | React Router v6 |
| **State Global** | React Context (`ActiveProjectContext`) + `localStorage` |
| **Backend API** | FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy (Async) |
| **Cola & Workers** | Celery + RabbitMQ (broker) + Redis (results/cache) |
| **Base de Datos** | PostgreSQL 16 + extensión `pgvector` (1536 dims) |
| **Infraestructura** | Docker Compose (db, redis, rabbitmq, backend-api, worker, beat, frontend) |
| **Servidor Web** | Nginx (sirve el build de producción de Vite, puerto 8090) |

---

## 🗄️ Modelo de Datos (Estado Actual)

### 🧬 `bands` — Ecosistema / Identidad
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `PK Integer` | ID del ecosistema |
| `owner_id` | `FK → users` | Propietario del ecosistema |
| `name` | `String(255)` | Nombre de la entidad |
| `role` | `String(100)` | Tipo: Cantante, Sello, Manager, etc. |
| `genre` | `String(100)` | Géneros (comma-separated, máx. 10) |
| `audience_age_range` | `String(50)` | Ej: `18-30` |
| `audience_location` | `String(255)` | Ej: `CABA, Argentina` |
| `tone_keywords` | `JSON []` | Tags de Tono (máx. 3) |
| `values_keywords` | `JSON []` | Tags de Valores (máx. 3) |
| `band_profile_vector` | `Vector(1536)` | Memoria Semántica de Identidad |
| `confidence_score` | `Float` | Grado de entrenamiento (0.0–1.0) |
| `auto_publish` | `Boolean` | Autopublicar posts aprobados |
| `posts_per_day` | `Integer` | Volumen de generación diaria (1-10) |

### 📡 `networks` — Nodos de Red Social
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `PK Integer` | ID del nodo |
| `band_id` | `FK → bands` | Ecosistema propietario |
| `platform` | `Enum` | `instagram`, `tiktok`, `youtube`, `twitter`, `facebook`, `spotify` |
| `oauth_token` | `Text (Encrypted)` | Token de acceso |
| `oauth_refresh_token` | `Text (Encrypted)` | Refresh token |
| `username` | `String(255)` | Handle de la cuenta |
| `followers_count` | `Integer` | Última medición |
| `last_scan` | `DateTime` | Último escaneo de contenido |
| `content_count` | `Integer` | Posts analizados |
| `is_active` | `Boolean` | Estado de la conexión |

### 📝 `generated_posts` — Posts Generados por IA
Campos clave: `caption`, `hashtags`, `cta`, `target_platform`, `status` (`pending`/`approved`/`edited`/`rejected`/`published`/`failed`), `approval_score`, `rejection_reason`, `edited_caption`, `campaign_id`.

### 📚 Tablas de Soporte
- **`content_posts`**: Posts históricos scrapeados de redes (eliminados en cascade al desconectar una red).
- **`content_patterns`**: Patrones descubiertos por el agente de análisis.
- **`learning_log`**: Log de eventos de aprendizaje del sistema semántico.
- **`campaigns`**: Campañas multi-post estratégicas.
- **`generative_feedbacks`**: Feedback detallado de contenido rechazado (con `reason_code`).
- **`band_profile_evolution`**: Snapshots mensuales del vector de perfil.
- **`band_members`**: Miembros del equipo del ecosistema.
- **`band_contexts`**: Contexto libre en clave-valor para el agente (ej. `Next Show Date`).
- **`visual_styles`**: Presets de estilo visual para el Director de Arte.

---

## 🌐 API REST — Endpoints Principales

### Auth
- `POST /api/v1/auth/signup` — Registro
- `POST /api/v1/auth/login` — Login (retorna JWT Bearer)
- `GET /api/v1/auth/me` — Usuario actual

### Bands (Ecosistemas)
- `GET /api/v1/bands/` — Listar todos los ecosistemas del usuario
- `GET /api/v1/bands/overview` — Resumen rápido multi-proyecto
- `POST /api/v1/bands/` — Crear ecosistema
- `GET /api/v1/bands/{id}` — Obtener ecosistema
- `PUT /api/v1/bands/{id}` — Actualizar ADN (nombre, género, tags, audiencia, config IA)

### Networks (Signal Chain)
- `GET /api/v1/networks/?band_id=X` — Listar redes del ecosistema
- `POST /api/v1/networks/connect/{platform}?band_id=X` — Conectar red (mock/ OAuth)
- `DELETE /api/v1/networks/{id}` — **Desconectar + Hard-Reset** (elimina ContentPosts)
- `POST /api/v1/networks/{id}/scan` — Escaneo manual de actividad
- `GET /api/v1/networks/{id}/status` — Estado del último escaneo

### Posts
- `GET /api/v1/posts/today?band_id=X` — Posts pendientes del día
- `POST /api/v1/posts/{id}/approve` — Aprobar post
- `POST /api/v1/posts/{id}/edit` — Editar caption
- `POST /api/v1/posts/{id}/reject` — Rechazar con feedback

### Analytics
- `GET /api/v1/analytics/overview?band_id=X` — Overview por ecosistema
- `GET /api/v1/analytics/aggregate` — Métricas combinadas de todos los ecosistemas

---

## 🪐 El "Semantic Loop" de Aprendizaje

```
Post Generado por IA
      ↓
  [Aprobado] → vector de éxito refuerza band_profile_vector
  [Editado]  → aprende la diff semántica
  [Rechazado] → reason_code → GenerativeFeedback → vector se aleja del fracaso
      ↓
 LearningLog registra el evento (impact_score)
      ↓
 Celery Task actualiza band_profile_vector (pgvector)
      ↓
 confidence_score sube o baja según tasa de aprobación
```

---

## 🧪 Estrategia de Calidad
- **Ownership**: Toda ruta valida `_verify_band_ownership(db, band_id, user_id)` antes de operar.
- **JWT**: Middleware de autenticación en todas las rutas protegidas. Auto-logout en 401 desde el frontend.
- **Límites de Tags**: Validado en frontend (UX) y pendiente de validación en backend (backlog).
- **Hard-Reset**: Garantizado vía cascade delete en `DELETE /networks/{id}`.
- **Unitarios + Integración**: Pytest + FastAPI TestClient.
- **E2E**: Playwright para flujos críticos.
