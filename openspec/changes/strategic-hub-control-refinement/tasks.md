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
5.  **[x] Testing and Validation (QA)**:
    *   Verify that approving a post immediately updates the button counter.
    *   Verify that switching views (Mapa vs Señal) hides/shows the volume selector correctly.
6.  **[x] GitHub Push**:
    *   Add spec files and modifications to Git.
    *   Push with commit message: `strategic-hub-control-refinement: Semantic UX + Semantic Controls`.
