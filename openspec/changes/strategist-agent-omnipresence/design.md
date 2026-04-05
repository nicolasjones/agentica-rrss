# Diseño Técnico (V6): Strategist Agent Omnipresence

> **Estado**: 🟢 PROPUESTO — Pendiente de ejecución por Claude.

## 🛠️ Arquitectura de Componentes
- **Layout.jsx**: Pasa a ser el contenedor principal del `AgentDrawer`.
- **SidebarLeft**: Añade el icono de `Brain` como un botón reactivo de visibilidad.
- **AgentDrawer**: Componente overlay (Z-Index alto) que aloja al `StrategistAssistant`.

---

## 🎨 Estética de "Mano Derecha": Glassmorphism
Para no saturar la vista técnica, el AgentDrawer debe ser:
- **Transparente sutil**: `bg-black/40 backdrop-blur-3xl`.
- **Borde "Electric"**: `border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]`.
- **Animación**: Entrada suave desde la derecha (0 -> 400px width o slide translate).

---

## 🔄 Lógica de Contexto & Persistencia
- El historial de mensajes se maneja en el **Layout** o en el propio `StrategistAssistant` si éste se mantiene "vivo" mientras el Layout persista.
- **Ruta de Exclusión**: 
    ```javascript
    const isEcosystemView = location.pathname.includes('/projects') || location.pathname.includes('/ecosystems');
    const showAgentToggle = !isEcosystemView;
    ```

---

## 🧬 Conectividad con la Agencia
Cada vez que el asistente cree un evento (`onEventsCreated`), dispararemos un **Evento Global (Dispatch)** o un callback del Layout que actualice el `Contexto del Proyecto` para forzar el re-fetch en las otras páginas abiertas.
