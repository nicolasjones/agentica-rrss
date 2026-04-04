# Requerimientos: Immersive Temporal Canvas (V5)

**Contexto**: Evolución UX del Planner V4 para gestión inmersiva.

## 1. Requerimientos Funcionales (REQ)

### [REQ-V5-001] Vista Dual (Period Toggle)
- **Mensual**: Grid estándar de 7 columnas por N filas.
- **Semanal**: Vista detallada tipo "Google Calendar" o "Lista Expandida Semanal" con franjas de horario.
- **Transición**: Switch animado en el header del Planner.

### [REQ-V5-002] Visualización "Title-First"
- En lugar de puntos o iconos, cada celda debe mostrar el **Título del Concepto** (Mapa) o el **Icono + Redacción Corta** (Señal).
- Si hay más de 3 posts por día → "Ver +N más" interactivo.

### [REQ-V5-003] Modal de Detalle Contextual
- Al cliquear un post o idea → **Popup (Modal)**:
    - Ver/Editar `concept_title` y `narrative_goal`.
    - Ver/Editar `caption` (Señal).
    - Selección/Edición de **Horario de publicación**.
    - Botón de **Eliminar** o **Aprobar** directo.

### [REQ-V5-004] Creación Manual (Drafting)
- Al cliquear el botón `+` en una celda vacía o seleccionada → Abrir Modal de Detalle en modo **NUEVO**.
- El usuario puede escribir su propia idea sin necesidad de generar un Batch completo por IA.

### [REQ-V5-005] Selección Reactiva
- Si el usuario selecciona una fecha → El `BatchReview` lateral se filtra automáticamente para esa fecha.
- Si no hay selección → El `BatchReview` muestra todo el periodo (Comportamiento actual).

### [REQ-V5-006] Event-First Header
- Un input de lenguaje natural permanente en el tope del calendario para cargar eventos del ecosistema rápidamente (ej: "Niceto el 20/05").

## 2. No Funcionales (NFR)
- **NFR-001 (Aesthetic)**: Las tarjetas dentro del calendario deben seguir el "Atomic Design" (Micro-Cards).
- **NFR-002 (Speed)**: Las transiciones de filtrado por fecha seleccionada deben ser instantáneas (< 100ms).
