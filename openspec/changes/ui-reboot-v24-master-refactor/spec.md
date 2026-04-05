# Master Spec: UI Reboot v2.4 (Agenmatica Suite)

## 👤 Módulo: Workspace / Selección de Ecosistemas
*   **Card Design**: Pantalla de entrada con tarjetas 16:9 ("Mis Ecosistemas"). Mostrando IA Match Rate, Nombre y seguidores totales. Al cliquear, persisten `active_band_id` en localStorage y redirigen a `/dashboard`.

## 🎛️ Módulo: Dashboard (Command Center)
*   **Weekly Signal Graph**: Gráfico de área (`recharts`, `stepAfter`) purpura neón sobre fondo negro de ruido. 
*   **Stat Cards**: 4 KPIs agregados del ecosistema.

## 👥 Módulo: Perfil ADN (Reactor de 3 Solapas)
*   **Modo de Seguridad (Edit Mode)**: La pantalla inicia en **Solo Lectura**. Debe pulsarse "EDITAR ADN" para habilitar los cambios (Inputs activos). Incluye botones para Guardar o Cancelar la edición.
*   **Pestaña 1: Identidad**: Nombre, Rol (Selector), Audiencia (Age Range anidado, Localización País/Província), Toggle Slang (Modismos regionales).
*   **Pestaña 2: IA Engine**: IA Match Score (Display circular neón), Toggles de Auto-Publish, Posts per Day (Slider 1-10) y TagSelectors (Tono y Valores, máx 3 tags). 
*   **Pestaña 3: Redes (Signal Nodes)**: Card de red con estado OAuth y botón de "Authenticate Node". Pop-up de confirmación para desconexión con Hard-Reset (elimina posts de esa red).

## 🗺️ Módulo: Strategic Planner V5 (Canvas Temporal)
*   **Calendario Grande (Grid 7-cols)**: Modo mensual por defecto con títulos de post en celdas. Si hay >3 posts, mostrar "+N más".
*   **Toggle Mapa/Señal**: Cambiar visualización del contenido de la celda entre Concepto (Mapa) e Icono de Red + Fragmento de Post Final (Señal).
*   **Modal de Detalle & Drafting**: Clic en post abre Modal de edición completa (Título, Narrativa, Caption, Horario). Clic en día vacío o "+" abre el mismo Modal en modo "NUEVO" (Drafting manual).
*   **Filtro Reactivo**: El BatchReview lateral se actualiza al tocar un día en el calendario grande (si se deselecciona, muestra todo el periodo).
*   **QuickAdd**: Input en header para eventos de lenguaje natural ("Lanzamiento el 20/05").

## 🧠 Módulo: Strategist Assistant (Omnipresencia V6)
*   **Drawer Global**: Panel derecho retráctil presente en Dashboard, Planner y Profile. Gatillable por botón de "Cerebro" en el Sidebar izquierdo fijo.
