# OpenSpec: Functional Specification (Full System)
> **Última actualización:** 2026-03-30 | Versión: 2.1.0

Este documento detalla todas las funcionalidades, flujos de trabajo y comportamiento esperado por sección.

---

## 📂 Desglose por Sección

### 0. 🗂️ Workspace Multi-Proyecto ("Mis Ecosistemas")
- Pantalla inicial post-login. Permite gestionar múltiples identidades (artistas, sellos, managers, agencias).
- **Cards de Ecosistema**: Cada proyecto muestra Nombre, Followers totales, Engagement Rate, y un ID de Ecosistema.
- **Nuevo Ecosistema**: Modal para crear un nuevo ecosistema con nombre libre.
- **Selección de Proyecto**: Clic en un card activa el ecosistema y redirige al Dashboard. El contexto queda persistido en `localStorage`.
- **Métricas Combinadas**: Header con 4 KPIs agregados de todos los proyectos: Audiencia Total, Nodos Activos, Confianza ADN Promedio, Engagement Total.

---

### 1. 🎛️ Dashboard (Panel Central)
- Vista de lectura de alto nivel del ecosistema activo.
- **Seguimiento Semanal**: Gráfico de volumen de posteos vs impacto.
- **Estado de la IA**: Barra de "Confianza ADN" en tiempo real según el progreso de aprendizaje.
- **Acceso Rápido**: Navega a Perfil para editar identidad o a Post Lab para revisar posts.

---

### 2. 👤 Perfil & ADN (Motor de Identidad)
Esta sección es el **corazón del sistema**. Cualquier cambio aquí redefine la identidad de la IA.

#### 🔒 Modo de Seguridad (Edit Mode)
- El perfil se muestra en **modo solo lectura** por defecto.
- Al pulsar **"EDITAR ADN"** se activa el modo edición y se habilitan todos los inputs.
- Los cambios se aplican solo al pulsar **"GUARDAR ADN"**. Un botón "Cancelar" revierte al estado original con un `loadData()`.

#### 🧬 Configuración de Identidad
- **Nombre de la Entidad**: Campo de texto libre para el nombre del artista/marca.
- **Tipo de Entidad (Rol)**: Selector de rol (Cantante, Banda, Productor, DJ, Sello Discográfico, Manager, Colectivo, Agencia).
- **Rango de Edad de Audiencia**: Input libre (ej. `18-30`).
- **Ubicación de Audiencia**: Input libre (ej. `CABA, Argentina`).

#### 🎵 Géneros Musicales
- Selección múltiple de chips desde un listado predefinido.
- **Límite**: Máximo 10 géneros. Contador visual `X/10`.
- Los géneros no seleccionados se deshabilitan al alcanzar el límite.

#### 🏷️ ADN Agenmatica (Tags de Tono & Valores)
- **Tono de Voz**: Selección de hasta **3** etiquetas predefinidas. Contador `X/3` en tiempo real.
- **Valores Core**: Selección de hasta **3** etiquetas predefinidas. Contador `X/3` en tiempo real.
- **Custom Tags**: En Modo Edición, se puede escribir una etiqueta personalizada y añadirla con la tecla `Enter`.
- **Eliminación**: En Modo Edición, clic en un tag activo lo remueve.
- **Validación**: No se puede guardar si cualquier categoría supera 3 etiquetas.

#### 🤖 Motor de IA — Config
- **Toggle Auto-Publicar**: Switch que activa/desactiva la publicación automática de los posts aprobados.
- **Posts por Día**: Slider de rango 1-10 que configura el volumen de generación diaria.

#### 📡 Gestión de Redes (Signal Chain)
- **Listar Redes**: Muestra todas las redes conectadas y desconectadas en un grid de cards.
- **Conectar Red**: Botón "Conectar Red" abre un **modal** con las plataformas disponibles. Las plataformas ya conectadas no aparecen en la lista, previniendo duplicados.
- **Escaneo Manual**: Botón "Scan" por nodo. Lanza `POST /networks/{id}/scan`, muestra spinner, y recarga datos al terminar.
- **Desconexión con Hard-Reset**: Botón de desconexión requiere confirmación de 2 pasos. Al confirmar, llama a `DELETE /networks/{id}` que elimina el nodo y limpia **todos** los `ContentPosts` asociados para no viciar el motor de aprendizaje.
- **Plataformas Soportadas**: Instagram, Twitter/X, LinkedIn, TikTok, Spotify, Facebook.

---

### 3. 🧪 Post Lab (Laboratorio de Contenido)
- **Review Feed**: Los borradores generados por la IA se presentan para su aprobación.
- **Estados de Post**: `Pendiente`, `Aprobado`, `Editado`, `Rechazado`, `Publicado`, `Fallido`.
- **Acciones**:
  - **Aprobar**: Mueve el post a la cola de publicación.
  - **Editar Caption**: Edición inline del texto propuesto.
  - **Rechazar con Feedback**: Sistema de entrenamiento negativo para la IA. Requiere motivo.

---

### 4. 🧬 Analytics
- **Vista de Rendimiento**: Comparativa multiplataforma de seguidores y engagement.
- **Análisis Profundo**: Desglose por plataforma, tipo de contenido y comunidad.
- **Datos Agregados**: Endpoint `GET /analytics/aggregate` disponible para el Workspace.

---

## 🔐 Seguridad & Reglas de Negocio
1. **Un solo Administrador**: Solo el `owner_id` puede ver/editar su ecosistema.
2. **Validación de Límites**: Máximo **3 etiquetas** de ADN (Tono o Valores) por categoría. Máximo **10 géneros**. No se puede guardar si se excede.
3. **Persistencia de Tokens**: Las credenciales OAuth se almacenan en la DB. El flujo actual usa un conector Mock; OAuth real es backlog.
4. **Hard-Reset de Red**: Al borrar una red (`DELETE /networks/{id}`), se eliminan todos los `ContentPosts` asociados para no viciar el motor con datos de una red desconectada.
5. **Estado de Edición**: El perfil no puede ser modificado accidentalmente — requiere activación explícita del Modo Edición.
