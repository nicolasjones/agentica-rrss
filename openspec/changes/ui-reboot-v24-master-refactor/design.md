# Design: Electric Circuitry of Chaos (v2.4)

## 🎨 Paleta de Referencia
- **Fondo Card**: `--surface-low: #131314` (Gris oscuro industrial).
- **Acento Primario**: `--primary: #cc97ff` (Purple Electric).
- **Acento Secundario**: `--secondary: #6bff8f` (Green Signal).
- **Tipografía**: Font-Display: `Epilogue`, Font-Body: `Inter`, Font-Mono: `Space Grotesk`.

## 📐 Layout Imersivo
- **Sidebar (Izquierdo)**: Ancho `w-64`, fondo `--surface-low`. MenuItems con icono + label neón. Dashboard, Post Lab, Creative Lab, Analytics, ADN Profile.
- **Header (Móvil/Sticky)**: Muestra el nombre del ecosistema activo y el botón de Strategist Assistant (`Brain`).
- **Drawer (Derecho)**: Panel retráctil con `framer-motion` (opcional) o CSS Transition. Z-Index de 50.

## ⚛️ Componentes React
- `Layout`: El núcleo que envuelve todas las páginas.
- `StatCard`: Una tarjeta de KPIs de gran impacto.
- `TagSelector`: Selector de etiquetas con lógica de contador `X/3`.
- `BatchReview`: El feed lateral que cambia su render a "ConceptCard" o "SignalCard" según el toggle global del Planner.
- `EventList`: Reconstruido para la estrategia del Planner.
