# KI: Agenmatica-Stack-Universal-V2.4-UltraQuota

## 🌌 Visión General
El Agenmatica-Stack es un entorno de desarrollo blindado para equipos de agentes autónomos. Maximiza la eficiencia de la cuota de tokens y elimina la fricción de comunicación a través de un riguroso sistema de diseño previo (OpenSpec) y ejecución por bloques (One-Shot).

## 🛠️ Infraestructura (OpenSpec)
- **Flujo**: Proponer -> Especificar -> Diseñar -> Tareas.
- **Directorio**: `openspec/`.
- **Estructura**: `changes/`, `system_spec/`, `knowledge/`.

## 🤖 El Equipo (The Squad)
- **Lead (Sonnet 4.5)**: Decisión y Producto.
- **Architect (Opus)**: Estructura y Escalabilidad.
- **Coder (Sonnet)**: Implementación Lógica.
- **Reviewer (Haiku)**: Auditoría de Seguridad y Calidad.

## ⚡ Directiva Ultra-Save
1. **Delegación a Haiku**: Búsquedas, Reviews de estilo, Unit tests básicos, Logs.
2. **One-Shot Logic**: Prohibido el micro-mensaje. El Lead entrega módulos completos listos para producción.
3. **Validación**: Git Atómico + Docker Compose + TDD.

## 📜 Reglas Pro
- Nada se entrega sin Unit, Security y E2E tests.
- Commits atómicos vinculados a REQ-IDs de la Spec.
- Haiku registra 'Lecciones Aprendidas' en `openspec/knowledge/lessons.md` al finalizar cada fase.
