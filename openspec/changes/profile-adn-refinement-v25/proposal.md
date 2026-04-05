# Proposal: Refinamiento de ADN Profile v2.5

Este cambio busca elevar la precisión de la segmentación de audiencia y la estabilidad de la conexión de redes en el ecosistema Agenmatica.

## Objetivos
1.  **Precisión Demográfica**: Reemplazar el ingreso de texto libre por un selector de rango (Slider) para alimentar los algoritmos de IA con datos numéricos exactos (`age_min`, `age_max`).
2.  **Localización Jerárquica**: Implementar un selector de País y Provincia/Estado para habilitar la futura inyección de "Slang Regional" y segmentación por nodos geográficos (LatAm, EEUU, España).
3.  **Activación de Nodos de Señal**: Corregir el bug de conexión de redes mediante un modal de selección de plataforma (FB, IG, YT, TT) y asegurar la visualización persistente del handle de usuario.

## Justificación
La estructura de datos anterior (`audience_age_range` como string) dificultaba la comparación semántica en el backend. Al normalizar estos campos, el `StrategistAssistant` podrá realizar cálculos de afinidad más precisos.
