# Design: Strategic Hub v3.0

Este documento detalla la estructura física y los componentes de UI del Strategic Hub.

## 1. El Hub Controller (Header)
- **Visual**: Barra horizontal sobre el calendario/lista con tres selectores claros.
- **Acción**: 
  - Switch 1 (Propósito): `MAPA` vs `SEÑAL`.
  - Switch 2 (Presentación): `[ 📅 CAL ]` vs `[ 📜 LISTA ]`.
  - Switch 3 (Tiempo): `[ MES ]` | `[ SEM ]` | `[ DÍA ]`.
- **Botón Táctico**: Botón flotante `🪄 IA Auto-Generate` (Se visualiza solo cuando hay eventos pero no hay señales en Modo Mapa).

## 2. Layout Full-Width (Focus Mode)
- **Remoción**: Eliminar la columna derecha (`BatchReview.jsx` lateral).
- **Inyección**: El contenido de la revisión se inyecta en la **Vista de LISTA del Modo SEÑAL**.
- **Contexto**: El `StrategistAssistant` (el Drawer derecho de la Omnipresencia) permanece disponible para hablar con la IA en cualquier momento.

## 3. Calendar v3 Cells (Ideación e Inyección)
- **En Modo MAPA**:
  - Celdas con iconos simples y títulos cortos de ideas.
  - El botón (+) abre un mini-popover con: `[ + Idea de Post ]`, `[ + Evento de Ecosistema ]`.
- **En Modo SEÑAL**:
  - Celdas con thumbnails de imagen si el draft tiene una, o icono de plataforma en color.
  - Click en celda abre el **Signal Editor** en un modal ocupando el 80% de la pantalla.

## 4. Signal List View (The Batch Refiner)
- **Formato**: Lista vertical ancha (Feed style).
- **Contenido**: Caption a pantalla completa para lectura fácil.
- **Micro-interacciones**:
  - Hover sobre un draft muestra botones de `[ ✅ Aprobar ]`, `[ 🪄 Refinar ]`, `[ 🗑️ Borrar ]`.
  - Icono de plataforma grande a la izquierda.
