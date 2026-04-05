- **Título**: "Post Lab" (Reemplaza a Temporal Canvas).
- **Limpieza**: Eliminación de la fila de métricas Pulse (Confianza ADN, Slang, Patrones) para foco absoluto en ejecución.
- **Granularidad**: Selector de "5 / 10 / 15 Ideas-Posts" para definir el volumen del batch actual.

## 1. Los Niveles del Hub (Modos Estratégicos)
- **Modo MAPA (Ideas/Events)**: 
  - Visualización de **Ecosystem Events** (Gigs, Launches, BTS).
  - Visualización de **Content Concepts** (Títulos de ideas, sin caption aún).
  - Herramienta: **Strategic Anchor Creator** (Click en celda abre modal con Tipo de Evento, Relevancia y Notas).
  - **Aprobación**: Las ideas deben ser aceptadas (Draft -> Accepted) para pasar a fase de Producción.
- **Modo SEÑAL (Content/Drafts)**:
  - Visualización del **Contenido Real** (Drafts con preview de imagen, red social y caption).
  - Edición: Posibilidad de editar caption, imagen, fecha y red social de forma directa.

## 2. Manipulación de Datos (DnD & Sync)
- **Drag & Drop**: Integración de `dnd-kit` con `DragOverlay` optimizado.
  - **UX**: El ítem original permanece estático (opacity 0.4) mientras el fantasma se desplaza.
  - **Retroalimentación**: Las celdas de destino se resaltan (Glow effect) al sobrevolar con un ítem compatible.

## 2. Los Modos de Vista y Tiempo (Visual Switch)
- **Visualización (Eje X)**: 
  - **MES**: Vista macro inmersiva (calendario actual).
  - **SEMANA**: Vista de 7 columnas táctica.
  - **DÍA**: Vista de 1 solo día focalizada en el horario de inyección.
- **Formato (Eje Y)**: 
  - **CALENDARIO (Grid)**: Foco en ritmo y balance.
  - **LISTADO (Feed)**: Foco en edición y curación profunda.

## 3. El Motor de Producción Híbrido y Curación de Ideas
- **Ciclo de Vida de Ideas (MAPA)**: Cada idea propuesta por la IA cuenta con acciones de `Aprobar`, `Refinar` y `Rechazar`.
- **Inyección en Cascada**: El generador de SEÑALES toma como input principal la cantidad de ideas aprobadas en el MAPA.
- **Lógica de Volumen (5/10/15)**: El selector de granularidad limita estrictamente las propuestas del Agente en ambos modos (Máximo de señales generadas = Valor del combo).

## 4. Drag & Drop Crítico
- **Calendario**: Cambio de `scheduled_date` al soltar en celda destino.
- **Listado**: Reordenamiento cronológico; al mover un ítem hacia arriba o abajo, se reprograma su fecha relativa para mantener la coherencia con el calendario.

## 5. Estrategia de Testing y Calidad
- **Unit Testing**: 
  - Validar lógica del selector 2x2 (Eje de Modo vs Eje de Vista).
  - Validar cálculo de rangos de fechas para filtros (Mes/Semana/Día).
- **E2E Testing (Playwright)**: 
  - Flujo de creación de evento en MAPA e impacto en el motor de generación.
  - Navegación recursiva entre vistas sin pérdida de estado.
- **Performance**: 
  - Lazy loading de thumbnails en el calendario para mantener FPS estables.

## 7. Protocolo de Sincronización de Navegación
- **Force Remount**: El componente `<Outlet />` en el `Layout` principal debe utilizar `activeBandId` como `key`.
- **Efecto**: Garantiza que al cambiar de "Nodo" (Proyecto), el estado de la página hija se limpie por completo y se disparen los `useEffect` de carga sin intervención del usuario (Adiós al F5).
