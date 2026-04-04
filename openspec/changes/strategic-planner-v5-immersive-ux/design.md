# Diseño Técnico: Immersive Temporal Canvas (V5)

**ID**: `strategic-planner-v5-immersive-ux`
**Contexto**: Refactor de la UI de `Planner.jsx` y extensión del modelo de datos para horarios.

## 1. Modelo de Datos (Extensión V5)

### 1.1 `strategic_posts` (Añadiendo Horario)
- **Columna**: `scheduled_time` → `Time` (o `DateTime` en `scheduled_date`).
- **Novedad**: `is_manual` → `Boolean`. Marcará si un post fue creado por el usuario o por la IA.
- **Relación**: Permitir que un `StrategicPost` pertenezca a un `StrategicBatch` con estado `manual_draft`.

---

## 2. Componentes Frontend (Arquitectura Atómica)

### 2.2 `CalendarGrid.jsx` (Rediseño)
- **Celdas Inteligentes**: Renderizarán una lista de `PostMicroCard.jsx` (Título + Hora).
- **Control**: Botón `+` (Añadir Idea) flotante en la celda al hacer hover.
- **Transición**: Toggle `Month | Week` para alternar entre el Grid y un Timeline vertical.

### 2.3 `PostDetailModal.jsx` (Pop-Up Contextual)
- **Header**: Título dinámico (Idea o Plataforma).
- **Body**: 
    - Inputs editables de `concept_title` y `narrative_goal`.
    - Editor de `caption` (React Textarea con auto-resize).
    - Selector de `scheduled_time` (HH:MM).
- **Footer**: Botones `Eliminar`, `Guardar Cambios`, `Aprobar`.

### 2.4 `EventQuickAdd.jsx` (Header Interface)
- Input de texto con interpretación de lenguaje natural en tiempo real (llamado a `/events/interpret`).

---

## 3. Interaction Flow

1.  **Selección de Fecha**: Al cliquear una celda → El estado `selectedDate` del context cambia. El `BatchReview.jsx` (o su evolución) se re-renderiza filtrado por esa fecha.
2.  **Apertura de Detalle**: Al cliquear una `PostMicroCard` → Se dispara el modal con el contenido persistido.
3.  **Manual Add**: Click en `+` → Modal vacío con la fecha ya pre-seleccionada.

---

## 4. QA & Security (V5)
- **TDD-004 (Schedules)**: Validar que el backend acepte y devuelva horarios en formato ISO.
- **TDD-005 (Manual Flag)**: Probar que los posts manuales persistan correctamente sin necesidad de pasar por el flow de la IA.
