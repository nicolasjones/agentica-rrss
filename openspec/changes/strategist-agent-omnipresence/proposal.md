# Propuesta: Omnipresencia del Strategist Agent (Fase 6)

## 🎯 Objetivo de Negocio
Transformar al **Strategist Assistant** de un componente local a un **Copiloto de Sistema (Omnipresente)** para asistir al usuario en cualquier sección técnica (Dashboard, Analytics, Post Lab, Creative Lab), manteniendo la coherencia estratégica a lo largo de toda la sesión.

## 🎨 Solución de Usuario (UX)
- **Panel Drawer Derecho**: Un contenedor colapsable en el margen derecho del layout principal.
- **Accionador Estático**: Un nuevo ícono de "Cerebro" (`Brain`) en el Sidebar izquierdo, visible globalmente.
- **Memoria de Charla**: El historial del chat persiste durante la navegación entre rutas del ecosistema activo.
- **Filtrado de Ruta**: El asistente se desactiva/oculta en la vista de "Mis Ecosistemas" (`/projects`) para mantener foco operativo.

## 🛠️ Desafío Técnico
- Mover el componente `StrategistAssistant` al `Layout.jsx`.
- Integrar `useLocation` para detectar rutas de exclusión.
- Asegurar que el `activeBandId` se pase correctamente vía Context/Global state.
- Rediseñar el `Planner.jsx` para aprovechar el espacio liberado por la extracción del agente local.
