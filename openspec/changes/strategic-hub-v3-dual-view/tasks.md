# Tasks: Strategic Hub v3.0

Es el manifiesto de inyección paso a paso para la re-arquitectura del Post Lab.

## Fase 1: Arquitectura, Limpieza y DnD
1. [x] Renombrar sección a "Post Lab" y eliminar PulseWidget Metrics Header.
2. [x] Eliminar el banner de "SIGNAL FEED" y contadores de aprobación (Limpieza total de ruido).
3. [x] **Implementar Key-Remounting en Outlet para eliminar dependencia de F5 (Navigation Sync Patch).**
4. [x] Instalar e implementar `@dnd-kit/core` para el arrastre de entidades entre fechas.
5. [x] Unificar el estado de ítems entre Calendario y Listado (Sync Total).

## Fase 2: Vistas de MAPA (Ideación y Curación)
4. [x] Crear `StrategicAnchorCreator`: Modal elaborado para añadir Eventos (Tipo, Relevancia).
5. [x] Implementar acciones de Aprobar/Refinar/Rechazar en la vista de lista de MAPA.
6. [x] Implementar el "Click-Anywhere" en celdas de calendario para inyección rápida.

## Fase 3: Vistas de SEÑAL y Lógica de Volumen
7. [x] Implementar el editor de Drafts (Captions, Redes, Imágenes) en modo SEÑAL.
8. [x] Vincular el Selector de Volumen (5/10/15) con los prompts de generación de IA.
9. [x] Sincronizar el botón de generación para que respete las ideas aprobadas en el Mapa.

## Fase 4: QA & Testing (Blindaje DnD y UX)
10. [x] Optimizar animaciones de DragOverlay (Eliminar doble transformación).
11. [x] Desarrollar Test de Integridad DnD (Persistencia de fecha tras drag).
12. [x] Desarrollar Test de Sync Vista (Calendario <-> Lista).
13. [x] Test de Aprobación Masiva: Verificar inyección de conceptos aceptados en modo SEÑAL.

## Fase 5: QA, Performance y Seguridad
14. [x] Crear Suite de **Unit Testing** para la lógica del selector temporal.
15. [x] Configurar Test **E2E (Playwright)** para el flujo completo Idea -> Señal.
16. [x] Implementar **Sanitización de Inputs** y validación de propiedad en el backend.
17. [x] Realizar auditoría de performance en el scroll de la Vista de Lista.
