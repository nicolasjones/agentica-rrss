# Design System Specification

## 1. Overview & Creative North Star: "The Electric Circuitry of Chaos"

This design system is not a standard SaaS utility; it is a high-performance command center designed for the intersection of raw stage energy and precision AI logic. The Creative North Star is **"The Electric Circuitry of Chaos."** 

We break the "template" look by treating the interface like a technical rider for a stadium world tour. We move away from the rigid, centered grids of modern web design in favor of intentional asymmetry, overlapping elements that mimic stacked guitar amps, and high-contrast typography scales that scream with the authority of a concert poster. This is a "Neon Grunge" aesthetic refined through a lens of premium, editorial sophistication.

## 2. Colors & Surface Philosophy

The palette is rooted in the "Obsidian" depths of the stage, punctuated by "Toxic" and "Electric" signals that indicate AI activity and system health.

### The "No-Line" Rule
Standard 1px solid borders for sectioning are strictly prohibited. In this design system, boundaries are defined through **background color shifts**. Use `surface_container_low` sections sitting on a `surface` background to define blocks of content. If a division is needed, use a change in tonal depth, not a stroke.

### Surface Hierarchy & Nesting
The UI is a series of physical layers, like stacked sheets of frosted obsidian glass.
- **Base Layer:** `surface` (#0e0e0f) for the main application canvas.
- **Secondary Sections:** `surface_container_low` (#131314) for sidebar or background groupings.
- **Active Components:** `surface_container_high` (#201f21) for elevated interactive elements.
- **Floating Modals:** `surface_container_highest` (#262627) to create maximum contrast against the base.

### The "Glass & Gradient" Rule
To escape the "flat" look, apply a 10% opacity noise texture over all `surface` layers. For floating panels, utilize **Glassmorphism**: use semi-transparent `surface_container` colors with a `backdrop-blur` of 12px–20px. 
- **Signature Signal:** Use a subtle linear gradient from `primary` (#cc97ff) to `primary_dim` (#9c48ea) for high-value CTAs to provide a "glowing tube amp" soul.

## 3. Typography: The Technical Poster

The typography strategy balances the "Concert Poster" impact with "Technical Manual" legibility.

- **Display & Headlines (Epilogue):** These are your "vocalists." They should be bold, aggressive, and used with tight letter-spacing (-0.02em to -0.05em). Use `display-lg` and `headline-lg` for impactful messaging, mimicking the condensed power of vintage rock flyers.
- **Body & Titles (Inter):** The "rhythm section." This provides the steady, reliable structure. `body-md` is the workhorse for data and descriptions, set in `tertiary` (#f9f9f8) for that "Fender Vintage White" look that is easier on the eyes than pure white.
- **Labels & Mono Data (Space Grotesk):** These represent the "AI circuitry." Use `label-md` for metadata, timestamps, and technical readouts. This font conveys precision and the "Cyber-Manager" aspect of the brand.

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "clean" for a grunge aesthetic. We achieve depth through **Tonal Layering**.

- **The Layering Principle:** Stack `surface_container_lowest` (#000000) cards on a `surface_container_low` section to create a "recessed" effect, or use `surface_bright` (#2c2c2d) to lift a component toward the user.
- **Ambient Shadows:** When a float is required (e.g., a dropdown), use an extra-diffused shadow with a 32px blur at 8% opacity. The shadow color should be `surface_container_lowest`, never a generic grey.
- **The "Ghost Border":** If a structural hint is required for accessibility, use the `outline_variant` (#484849) at **20% opacity**. This creates a "barely-there" circuit line that guides the eye without cluttering the interface.
- **Circuitry Accents:** Borders on primary containers should occasionally feature "clipped corners" or 90-degree "traces" reminiscent of guitar pedal circuit boards.

## 5. Components

### Buttons
- **Primary:** Background `primary` (#cc97ff), Text `on_primary` (#47007c). Roundedness `sm` (0.125rem) for a sharp, aggressive edge.
- **Secondary:** Background `secondary` (#6bff8f), Text `on_secondary` (#005f28). High-visibility "Toxic Green" for positive actions (e.g., "Go Live," "Launch Agent").
- **Tertiary:** No background. Text in `tertiary` (#f9f9f8) with a 1px `outline_variant` at 20% opacity.

### Input Fields
Inputs should feel like rack-mounted gear. Use `surface_container_highest` for the field background. Labels must use `label-sm` in `on_surface_variant` (#adaaab), positioned strictly above the input. The focus state uses a 1px solid `secondary` (#6bff8f) "glow" effect.

### Cards & Lists
- **Prohibition:** Divider lines are forbidden. 
- **Execution:** Separate list items using 1.3rem (`6`) of vertical whitespace or a subtle background toggle between `surface_container_low` and `surface_container`. 
- **Visual Tension:** Use the spacing scale `10` (2.25rem) for outer padding to let the content breathe, contrasting with the "tight" typography.

### Bespoke Component: "The Signal Chain"
A custom workflow visualization component. Use `secondary` (#6bff8f) for active paths and `primary` (#cc97ff) for processing nodes. Connection lines should be "Ghost Borders" that illuminate with a gradient when data is flowing.

## 6. Do's and Don'ts

### Do:
- **Use Asymmetry:** Align headlines to the left while keeping technical data justified to the right to create "visual tension."
- **Embrace the Grain:** Apply a subtle noise overlay to all obsidian surfaces to prevent the UI from feeling "too digital" and flat.
- **High Contrast:** Ensure all `Vintage White` text sits on `surface_dim` or darker to maintain the "backstage" vibe.

### Don't:
- **Don't use Rounded Corners > 0.5rem:** Keep the aesthetic sharp. Only use `full` for status indicators or specific toggle switches.
- **Don't use generic iconography:** All icons should be a custom hybrid—e.g., a microphone icon that transitions into a circuit board trace.
- **Don't use "Safe" Blues:** If the color isn't a deep obsidian, a toxic green, or an electric purple, it doesn't belong in the "Signal Chain." Avoid standard brand blues or oranges.
- **Don't Center-Align everything:** Central alignment is for templates. We are building a custom-tuned instrument; use the grid to create unexpected, editorial compositions.