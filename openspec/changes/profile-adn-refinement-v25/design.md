# Design: Perfil ADN Refinement v2.5

Este documento detalla la estructura UI y los componentes de UI que se inyectarán en `Profile.jsx`.

## 1. DualRangeSlider.jsx (Componente UI)
- **Visual**: Línea sólida de 2px en `var(--primary)`.
- **Gatillos**: 2 Círculos de 12px con sombra neón.
- **Leyenda**: `18 - 65+` (Extremos).
- **Badge Flotante**: `35 años` sobre el gatillo móvil.

## 2. GeoSelector (Componente Inyectado)
- **Grid Lógico**: 
  - Columna 1: `Country` – Dropdown (Select neón).
  - Columna 2: `Province/State` – Dropdown que cambia según `Country`.
- **Slang Status**: Badge lateral que dice `Regional Slang: Active/Inactive`.

## 3. PlatformConnectModal.jsx (Capa de Inyección)
- **Fondo**: Overlay oscuro al 80% (`var(--surface-high)`).
- **Selector**: 4 Cajas cuadradas con íconos grandes de Lucide (`Facebook`, `Instagram`, `Youtube`, `Music` para TikTok).
- **Efecto**: Hover en `var(--primary)` con borde pulsante.

## 4. SignalNodeCard (Refinamiento)
- **Información**: Mostrar `@handle` en `var(--secondary)` al lado del ícono.
- **Acción**: Mantener el botón de desconexión en la parte inferior.
- **Animación**: El nodo parpadea suavemente cuando está "Active".
