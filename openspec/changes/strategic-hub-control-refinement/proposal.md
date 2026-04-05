# Proposal: Strategic Hub Control Refinement

## Vision
The current Strategic Hub control interface presents ambiguous button labels and persistent parameters that do not apply to all states. This proposal aims to align the system's language with the user's mental model: "Map first, Produce later". By making the generation button dynamic and context-aware, we provide a clearer closure of the feedback loop.

## Justification
1.  **Clarity**: Users often get confused between generating ideas (concepts) and signals (final post text).
2.  **Accuracy**: Showing the exact number of approved ideas to be processed as signals prevents accidental generations and provides a clear signal count.
3.  **UI Cleanliness**: The volume selector (5, 10, 15) is only relevant to the "Map" phase where new ideas are being seeded. In "Production", the volume is already determined by user approval.

## Impact
- **Frontend**: Modifies `Planner.jsx` (Hub Controller area).
- **UX**: Improves semantic feedback and reduces cognitive load.
