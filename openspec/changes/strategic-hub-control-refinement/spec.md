# Spec: Strategic Hub Control Refinement

## Functional Requirements
1.  **Contextual Generation Button (The UI Instrument)**:
    *   **Strategy View**: The button must read "Generar Ideas". It uses the selected volume.
    *   **Production View**: The button must read "Generar Señales ([count])".
    *   The `[count]` must reflect the number of posts in the current batch with `is_approved === true`.
2.  **Safety Guard**:
    *   In Production View, the "Generar Señales" button is **disabled** if `count === 0`.
3.  **Contextual Parameter Filter**:
    *   The **Volume Selector** (dropdown with 5, 10, 15 posts) must be **hidden** when `hubMode === 'production'`.
    *   The value from this selector must be passed to the `generate` API call.

## Technical Requirements
- **Framework**: React (using `useState` and derived state).
- **Core Component**: `Planner.jsx`.
- **Derived State**: Calculate `approvedCount` before `renderGenerateButton`.
- **API Synchronization**: Ensure `plannerAPI.generate` receives the updated `volume`.

## Testing & Validation criteria
1.  **Unit: Mode-Aware Labels**:
    *   Verify that `renderGenerateButton()` returns "Generar Ideas" when `hubMode === 'strategy'`.
    *   Verify that `renderGenerateButton()` returns "Generar Señales (X)" when `hubMode === 'production'`.
2.  **Unit: Visibility Logic**:
    *   Verify that the volume dropdown is **not** present in the DOM when `isSignalMode` is true.
3.  **Unit: Safety State**:
    *   Verify the Generate Signals button has the `disabled` attribute when the approved posts list is empty.
4.  **E2E Flow**:
    *   Scenario: User approves 3 ideas in Mapa -> user clicks "Señal" mode -> user verifies button says "Generar Señales (3)" -> user clicks it and verifies the production cycle starts.
