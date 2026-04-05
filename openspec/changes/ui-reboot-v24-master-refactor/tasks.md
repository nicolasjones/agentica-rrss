# Tasks: UI Reboot Master Refactor (v2.4)

## 📋 Fase 1: Cimientos y Diseño Digital
1. [x] Unificar `index.css`: Inyectar los tokens finales del diseño "Circuitry of Chaos".
2. [x] Reconstruir `Layout.jsx`: Sidebar fijo + Drawer derecho (StrategistAssistant) + Status de Sistema.
3. [x] Reconstruir `ActiveProjectContext`: Asegurar que el `active_band_id` se persista en `localStorage` y que los datos se refresquen al cambiar de ecosistema.
4. [x] Inyectar `HeaderProvider` (opcional si se usa en SideBar/Layout).

## 📋 Fase 2: Puerta de Entrada y Control
1. [x] Implementar `/projects`: Pantalla de "Mis Ecosistemas" con cards 16:9 y selección de proyecto.
2. [x] Implementar `/dashboard`: Recharts `AreaChart` (stepAfter) purpura + 4 StatCards con tendencia.

## 📋 Fase 3: Strategic Planner (El Gran Calendario)
1. [x] Implementar `Planner.jsx`: Modo mensual (Big Calendar 7-cols) como contenedor principal.
2. [x] Implementar Toggle Superior: "Modo Mapa" vs "Modo Señal" (Estado global del Planner).
3. [x] Reconstruir `BatchReview`: Integrar filtrado reactivo por fecha seleccionada en el calendario.
4. [x] Inyectar `EventQuickAdd` en el header del Planner.

## 📋 Fase 4: Perfil ADN (Reactor de Solapas)
1. [x] Reconstruir `Profile.jsx`: Implementar las 3 pestañas: [Identidad / IA Engine / Nodos de Red].
2. [x] Inyectar `TagSelector` con lógica de 3 tags máximo en la pestaña IA Engine.
3. [x] Implementar Modal de "Authenticate Node" en Nodos de Red.

## 📋 Fase 5: Omnipresencia y Soporte
1. [x] Activar `StrategistAssistant` en el Drawer derecho.
2. [x] Inyectar `HelpTooltips` en todos los campos técnicos de ADN y Planner.
