# Tasks: Perfil ADN Refinement v2.5

Este es el manifiesto de inyección paso a paso para completar el refinamiento de la v2.5.

## Fase 1: Infraestructura y UI Components
1. [x] Crear `RangeSlider.jsx` en `frontend/src/components/` (Soporte Dual min/max).
2. [x] Crear `PlatformConnectModal.jsx` (Modal central de selección FB, IG, YT, TT).
3. [x] Preparar el JSON de países/provincias (`Latam`, `USA`, `Spain`) en un archivo de utilidades/constantes.

## Fase 2: Inyección de Identidad (Profile Tab 1)
4. [x] Inyectar `RangeSlider` en `Profile.jsx` (Reemplazando el Input de texto de EDAD).
5. [x] Inyectar el nuevo Selector Geográfico jerárquico (Reemplazando `audience_location`).
6. [x] Sincronizar el estado del componente con `audience_age_min`, `audience_age_max`, `audience_country`, y `audience_province`.

## Fase 3: Inyección de Nodos (Profile Tab 3)
7. [x] Actualizar el trigger de "Deploy New Node (+)" para que abra el `PlatformConnectModal`.
8. [x] Implementar la función `handleConnect` en `Profile.jsx` para gestionar el backend `networksAPI`.
9. [x] Refinar `NetworkCard` para mostrar el `@handle` de forma prominente en `var(--secondary)`.

## Fase 4: Sincronización API
10. [x] Asegurar que `bandsAPI.update` envíe los nuevos campos atómicos al backend.
11. [x] Validar que el `HeaderContext` muestre el nombre del ecosistema actualizado tras el Save.
