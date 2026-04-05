# @workflow Agenmatica-Stack [v2.4]: Ultra-Quota (Claude Pro) Optimization

Este workflow orquesta a un equipo de agentes especializados, optimizado para **mínimas llamadas de sesión** (Mínimo Ping-Pong).

## 📜 Reglas de Oro (Mandatarias)
1.  **Diseño Primero**: Consultar `openspec/changes/` antes de codear.
2.  **TDD & Seguridad**: Nada está terminado sin Unit Tests y Seguridad (Multi-tenancy).
3.  **Bitácora (Self-Learning)**: Registrar APRENDIZAJE en `openspec/knowledge/lessons.md`.
4.  **Higiene**: `git commit` por tarea/módulo y validar con `docker compose`.

## 👥 Equipo de Agentes (Roles)
- **Lead (Sonnet 4.5)**: Toma decisiones de producto y orquestación.
- **Architect (Opus)**: Valida la escalabilidad y diseño de la DB/API. 
- **Coder (Sonnet)**: Implementa la lógica y los casos de uso. 
- **Reviewer (Haiku)**: Audita la seguridad, linting y tests de regresión.

## 🔄 El Pipeline de Ejecución (One-Shot Logic)
- **Módulos Lógicos Completos**: El Lead implementa módulos de funcionalidad de principio a fin en una única respuesta extensa. 
- **Prohibición de Ping-Pong**: No se permite el intercambio de micro-mensajes de confirmación ("¿Estás listo?", "¿Sigo?"). El agente debe auto-validar y entregar el bloque final funcional.
- **Validación Única**: Haiku realiza UNA sola revisión profunda al finalizar el bloque lógico completo antes de reportar progreso al usuario.


## 💬 Política de Comunicación
- **Minimalismo de Mensajes**: Favorecer el "Hacer" sobre el "Informar". Un mensaje largo es mejor que cinco cortos.
- **Salida**: Ignorar el límite de 300 tokens si es necesario para entregar un módulo funcional completo en un solo turno.
- **Validación**: `openspec verify` solo al final del Bloque Lógico.

## 🚀 TEST EJECUTAR
`@workflow Agenmatica-Stack con Agent Teams y ultra-ahorro de cuat: [Descripción del cambio]`
