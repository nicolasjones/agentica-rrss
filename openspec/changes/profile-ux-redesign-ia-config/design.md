# Design Técnico: Rediseño Perfil & IA Config (V2.0)

## 1. Diseño de Datos (Backend / DB)
### 1.1 Nueva Estructura del Perfil `Band`
- Añadir a la tabla `bands`:
  - `audience_age_min` (Integer, default=18)
  - `audience_age_max` (Integer, default=35)
  - `audience_country` (String, nullable=True)
  - `audience_province` (String, nullable=True)
  - `use_regional_slang` (Boolean, default=False)
- *Migración:* Generar script con Alembic.

### 1.2 Depreciación
- `audience_age_range` y `audience_location` se mantienen temporalmente pero son opcionales (o se migran por script).

## 2. Componentes Frontend (React / Vite)
### 2.1 Pestañas de Perfil
- Implementación de un componente `Tabs` (Identidad / Configuración IA).

### 2.2 Selectores de Localización
- Componente `CountryProvinceSelector`: Consume un JSON estático de `LocationData.js`.

### 2.3 Help Icon (Contextual Tooltips)
- Crear componente reutilizable `HelpTooltip` con Lucid-react `Info` con efectos de hover estilizados (neon glow?).

### 2.4 Pop-up de Confirmación
- Componente `ConfirmModal` estilizado para la desconexión de redes sociales. 

## 3. UI/UX (Aesthetics)
- **Tooltips:** Fondo transparente (Glassmorphism), texto en font-mono, bordes neón.
- **Botones de Redes:** Unificar estados de `hover` y corregir el evento `onClick` del `ConnectModal`.
