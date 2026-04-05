# Tasks: Strategic Hub Control Refinement

1.  **[x] Frontend Layout Refactor (Planner.jsx)**:
    *   Initialize `approvedCount` variable in `Planner.jsx` from the current batch state.
    *   Implement conditional rendering for the volume selector (`!isSignalMode`).
2.  **[x] Semantic Button Refactor (Planner.jsx)**:
    *   Update `renderGenerateButton` to implement the dynamic text logic:
        *   "Generar Ideas" (Brain icon)
        *   "Generar Señales ([approvedCount])" (Zap icon).
3.  **[x] Action Dispatching (Planner.jsx)**:
    *   Ensure the `handleGenerate` call uses the current `volume` state.
    *   Ensure the "Generar Señales" button is disabled if `approvedCount === 0`.
4.  **[x] Testing and Validation (QA)**:
    *   Created `frontend/src/tests/StrategicHubControls.test.jsx` — 19 unit tests (all passing).
    *   Updated `frontend/e2e/post-lab-idea-to-signal.spec.js` — 5 E2E scenarios (CR-01 to CR-05).
    *   Added vitest + @testing-library/react to devDependencies.
5.  **[x] GitHub Push**:
    *   Committed with message: `feat: strategic-hub-control-refinement — Semantic UX + Semantic Controls`.
