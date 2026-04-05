# Design: Strategic Hub Control Refinement

## UI/UX Plan

### The Controller Layout (Planner.jsx)
The controller area will present as follows:

1.  **Left Block**: View Switches (Mapa/Señal, Cal/Lista).
2.  **Right Block**: Context-Aware Input.
    *   **IF (Mapa)**:
        *   Platform Selector (Instagram, TikTok, etc.)
        *   **Volume Dropdown**: (5, 10, 15)
        *   **Action Button**: `BTN-SECONDARY` with `Brain` icon + "Generar Ideas".
    *   **IF (Señal)**:
        *   Platform Selector (Instagram, TikTok, etc.)
        *   **Action Button**: `BTN-SECONDARY` with `Zap` icon + "Generar Señales ([count])".
        *   (Volume Dropdown is Hidden).

### Interaction Flow
1.  User enters **Mapa**.
2.  User selects **Volume** (e.g., 10).
3.  User clicks **"Generar Ideas"**.
4.  User **Approves/Rejects/Refines** ideas. 
5.  The counter on the **"Generar Señales ([count])"** button updates in real-time.
6.  User clicks **"Generar Señales (X)"** to commit the batch.

## Data Schema (Frontend)
- **Local State Variable**: `volume` will already exist but its visibility will be conditional.
- **Derived Count**: `const approvedCount = batch?.posts?.filter(p => p.is_approved).length || 0;`
