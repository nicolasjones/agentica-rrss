# Propuesta: Strategic Command Center (V4)

**ID**: `strategic-planner-v4`
**Estado**: ✅ IMPLEMENTADO — 2026-04-03
**Versión**: V4.0

---

## 1. Visión: De Generador Reactivo a Agencia de Contenido Autónoma

Agenmatica V4 introduce el **Strategic Command Center**: un sistema que transforma la plataforma de un generador de posts individuales a una **Agencia de Contenido Proactiva** orientada a eventos reales del artista.

La arquitectura separa tres capas de responsabilidad:

| Capa | Nombre | Rol |
|------|--------|-----|
| Input | **Ecosistema de Eventos** | El artista registra su realidad (shows, lanzamientos, ensayos) |
| Procesamiento | **Strategist Agent** | La IA propone un batch de posts estratégicos basado en ADN + eventos |
| Output | **Batch Review** | El artista aprueba, refina o rechaza cada post antes de publicar |

---

## 2. Los Tres Pilares

### Pilar I — El Espejo (Ecosistema de Eventos)
El artista carga su realidad mediante dos canales:
- **Formulario manual**: título, fecha, categoría, descripción opcional.
- **Asistente en lenguaje natural**: chat lateral donde se escribe *"tenemos show el 15 de mayo"* y la IA extrae los eventos automáticamente.

Categorías soportadas: `GIG`, `LAUNCH`, `BTS`, `ANNOUNCEMENT`, `OTHER`.

### Pilar II — El Mapa (Strategist Agent)
Dado un timeframe (`weekly` / `biweekly` / `monthly`), el Agente genera un batch de posts para cada evento dentro del periodo usando arquetipos narrativos:
- **Pre-evento**: expectativa y hype antes del hecho.
- **Día-de-evento**: activación en tiempo real.
- **Recap**: capitalizar el momentum post-evento.
- **Neutral**: contenido de marca sin evento puntual.

### Pilar III — La Señal (Batch Review)
El artista revisa cada post propuesto. Puede:
- **Aprobar** individualmente.
- **Refinar** con feedback textual (el Agente reescribe el post).
- **Rechazar** (el post desaparece del batch).
- **Aprobar el Batch completo**: los posts aprobados se promueven a `GeneratedPost` y quedan disponibles en el Post Lab.

---

## 3. Valor Agregado

- **Control creativo**: el artista define la estrategia antes de preocuparse por el texto.
- **Eficiencia**: planificar 30 días toma segundos; el Agente se ocupa de la redacción.
- **Integración ADN**: tono, modismos regionales y valores de la banda guían cada caption generado.
- **Asistente conversacional**: registro de eventos sin formulario, en lenguaje natural.

---

## 4. Métricas de Éxito

- 100% de los eventos del ecosistema cubiertos por narrativas automáticas dentro del timeframe.
- 100% de coherencia entre ADN de Perfil (tono, slang, audiencia) y captions generados.
- Reducción del tiempo de planificación semanal vs. carga manual de posts.
