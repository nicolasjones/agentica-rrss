# Reglas de Trabajo: Metodología OpenSpec

**CONTEXTO**: Este proyecto utiliza **OpenSpec** para gestionar todos los cambios significativos. Ninguna funcionalidad se implementa sin un paso previo de especificación técnica y diseño.

## 📜 Reglas de Oro para Claude (Implementador)
1.  **Lee primero, escribe después**: Antes de tocar `backend/` o `frontend/`, DEBES consultar la carpeta `openspec/changes/`.
2.  **Sincronización de Tareas**: Si vas a implementar un cambio, lee el archivo `tasks.md` de ESE cambio.
3.  **Mandato de Tests (TDD)**: Ninguna tarea se considera terminada si no tiene sus Test correspondientes (Unitarios, Seguridad, E2E) definidos en el diseño.
4.  **Integración Continua**: Ejecutar `docker compose up --build` y realizar `git commit` después de cada avance significativo.
5.  **Actualiza el Progreso**: Marca el checkbox `[x]` en el `tasks.md` correspondiente.
6.  **Inconsistencias**: Si encuentras algo en el código que contradiga la especificación de OpenSpec, **detente** y advierte al usuario. La especificación es la ley.

### 4. Verificación (QA & Security)
- **Cero Tolerancia**: Correr tests unitarios, de seguridad (multi-tenancy) y E2E (Playwright).
- **Control**: Usar `openspec verify` para comprobar cumplimiento de REQ-IDs.

### 5. Deploy & Sync
- **Git**: Realizar commits atómicos por tarea.
- **Docker**: Levantar entornos locales para validar la integración final.
- **Punto de Control**: No ejecutar deploy definitivo sin confirmación humana.

## 📁 Estructura de OpenSpec
- `openspec/system_spec/`: Contiene la verdad actual de todo el sistema (Arquitectura global, Modelos base).
- `openspec/changes/<context-id>/`: Contiene los archivos de un cambio específico:
    - `proposal.md`: El "por qué" y el valor del cambio.
    - `spec.md`: Requerimientos funcionales detallados.
    - `design.md`: Especificación técnica (API, DB, UI).
    - `tasks.md`: Lista de tareas granular para la implementación.

## 🔄 Flujo de Trabajo
1.  **Fase de Exploración**: El usuario y el Arquitecto definen el cambio.
2.  **Fase de Diseño**: Se crean los 4 archivos en `openspec/changes/`.
3.  **Fase de Implementación**: Tú (Claude) tomas el relevo y ejecutas las tareas de `tasks.md`.
4.  **Fase de Archivo**: Una vez terminado, el cambio se mueve a `openspec/archived/`.
