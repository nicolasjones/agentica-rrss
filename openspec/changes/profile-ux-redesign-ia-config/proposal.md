# Propuesta: Rediseño de Perfil y Configuración de IA

## 1. Visión General
El perfil actual presenta fricciones de usabilidad y falta de claridad en términos técnicos ("IA Match Rate", "IA Engine"). Esta propuesta busca transformar el Perfil en el centro de comando estratégico de la marca, separando la identidad humana de la configuración técnica de la IA, y mejorando la precisión de los datos de audiencia para alimentar mejor los modelos de lenguaje.

## 2. Puntos Clave del Rediseño
- **Estructura por Solapas:** División en "Identidad de Marca" (Brand) e "Inteligencia Artificial" (AI System).
- **Precisión Geográfica:** Implementación de selectores país/provincia para un targeting exacto.
- **Voz y Modismos:** Inclusión de un toggle para permitir o restringir el uso de jerga regional (slang).
- **Transparencia (Tooltips):** Explicación de términos técnicos mediante iconos de ayuda contextual.
- **Gestión de Señal (Redes):** Estabilización de la conexión de nodos y proceso de desconexión seguro (con confirmación).

## 3. Justificación
Un agente de IA es tan bueno como los datos con los que se le entrena. Al estructurar la edad como un rango numérico y la ubicación como niveles geográficos, permitimos que el generador de contenido sea mucho más coherente con la realidad del artista.

## 4. Mandato de Infraestructura
Para garantizar la paridad entre entornos de desarrollo, staging y producción, y evitar errores de dependencias locales (como librerías de vectores o bases de datos), se establece que **todo desarrollo y ejecución del proyecto DEBE realizarse mediante Docker**.

- El backend (API, Worker, Beat), la base de datos (pgvector), el broker (RabbitMQ), el cache (Redis) y el frontend deben orquestarse siempre con `docker-compose`.
- No se admite la ejecución nativa de servicios individuales fuera de los contenedores para tareas de desarrollo o validación.
