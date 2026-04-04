## 1. Módulo: Identidad de la Entidad (Marca)
### 1.1 Nueva Estructura de Audiencia
- **Edad:** Campos `audience_age_min` (entero) y `audience_age_max` (entero) para definir el target de la entidad artística.
- **Localización (País):** Select de lista estática (Iberoamérica + EEUU).
- **Localización (Provincia/Estado):** Select dependiente del país elegido.
- **Check de Modismos:** Toggle boolean `use_regional_slang` para definir si la IA debe "mimetizarse" localmente o hablar neutro.

### 1.2 Gestión de Integrantes
- *Nota:* Esta funcionalidad queda **centralizada en el Creative Lab**. El Perfil solo gestiona la configuración de la Entidad como un todo.

## 2. Módulo: Configuración del Sistema de IA
### 2.1 Tabulación de Configuración
- Trasladar los campos "IA Match Rate", "Auto-Publicar" y "Posts por Día" a una pestaña dedicada llamada "Configuración IA".

### 2.2 Explicaciones Contextuales Universales
- **Todos** los elementos del perfil (Nombre, Género, Localización, Tonos, Valores, Motor de IA, etc.) deberán incluir un icono de información `(i)`.
- Al posicionarse encima (hover), mostrará una descripción clara y no técnica de para qué sirve ese campo y cómo afecta a la Inteligencia Artificial.

## 3. Módulo: Gestión de Redes (Signal Nodes)
- **Seleccion de Red:** Corregir el bug que impide que el clic en "Authenticate Node" responda.
- **Plataformas Soportadas:** Facebook, Instagram, YouTube, TikTok.
- **Desconexión:** Al presionar el botón de eliminar, se debe mostrar un Pop-up con las opciones [CONFIRMAR / CANCELAR].
