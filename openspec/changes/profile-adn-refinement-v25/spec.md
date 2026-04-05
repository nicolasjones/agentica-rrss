# Spec: Perfil ADN Refinement v2.5

Este documento define la funcionalidad exacta de los nuevos selectores y el sistema de inyección de redes.

## 1. Selector de Edad (Audience Age)
- **Tipo**: Dual Range Slider (18 a 65+).
- **Campos**: `audience_age_min` y `audience_age_max`.
- **UI**: Visualización en tiempo real del rango seleccionado (ej: "18 - 35 años").
- **Comportamiento**: En Modo Edición, deslizar los gatillos; en Modo Solo Lectura, mostrar el badge de rango.

## 2. Selector Geográfico (Audience Location)
- **Modo Cascada**: 
  - Selector 1: **País** (Argentina, España, EEUU, Chile, Uruguay, México, Colombia, Perú).
  - Selector 2: **Provincia/Estado** (Cargado dinámicamente según el país elegido).
- **Campos**: `audience_country` y `audience_province`.
- **Slang Toggle**: Mantener el switch de `use_regional_slang` que ya existe cerca de la ubicación.

## 3. Nodos de Señal (Social Networks)
- **Trigger**: El botón "Deploy New Node (+)" abre un **Popup (Modal)** central.
- **Plataformas**: 
  - Facebook
  - Instagram
  - YouTube
  - TikTok
- **Flujo de Conexión**: 
  - Selección de ícono -> Prompt de conexión (Mock por ahora) -> Inyección de cuenta.
- **Visualización**: La card debe mostrar el `handle (@nombre)` obtenido de la API y el ícono de la plataforma en color.
- **Remoción**: El botón "Remove Signal Node" debe resetear la conexión y liberar el slot.
