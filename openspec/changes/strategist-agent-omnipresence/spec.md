# Especificación Funcional (V6): Strategist Agent Omnipresence

> **Estado**: 🟢 PROPUESTO — Pendiente de ejecución por Claude.

## 🎯 Caso de Uso: Soporte Estratégico Continuo
El usuario puede invocar el **Strategist Assistant** desde cualquier página técnica. El asistente sabe en qué contexto se encuentra y puede sugerir la creación de eventos o posteos basándose en los datos visibles (próximamente: soporte multi-contexto de IA).

## 📄 Requerimientos Funcionales
- **RF-001: Drawer Global**: Panel derecho retráctil (`SidebarRight`) que aloja el componente `StrategistAssistant`.
- **RF-002: Gatillo Estático**: Botón de "Cerebro" (`Brain`) en el sidebar izquierdo fijo que conmuta la visibilidad del Drawer.
- **RF-003: Persistencia de Sesión**: El historial de chat del asistente se mantiene al cambiar de ruta (`/dashboard` <-> `/analytics`).
- **RF-004: Ruta de Exclusión**: El asistente NO debe cargarse ni mostrarse si la ruta es `/projects` o `/ecosystems`.
- **RF-005: Refresh de Datos**: Cualquier evento creado en el asistente debe notificar globalmente para refrescar las vistas activas (ej: el calendario del Planner).

---

## 🛠️ Reglas Técnicas
- **Componente**: `StrategistAssistant` hereda el `activeBandId` del hook `useActiveProject()`.
- **Layout**: Uso de `framer-motion` o CSS Transitions para la animación de entrada/salida del Drawer.
- **Z-Index**: El Drawer debe estar por encima del contenido principal pero por debajo de los modales.
- **Responsividad**: En móvil, el Drawer debe ocupar el 100% de la pantalla y tapar el contenido.
