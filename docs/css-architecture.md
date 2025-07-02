# CSS Architecture Documentation

## Overview

ScribeFlow uses a component-based CSS architecture with automated build tools to maintain scalable, maintainable stylesheets for the Obsidian plugin environment.

## Architecture Principles

### 1. Component Isolation
- Each UI component has its own CSS file
- Styles are namespaced with `sfp-` prefix to avoid conflicts
- Components are self-contained and reusable

### 2. Design System Foundation
- Centralized design tokens in `variables.css`
- Consistent spacing, typography, and color scales
- CSS custom properties for theme compatibility

### 3. Automated Quality Control
- Stylelint for CSS standards enforcement
- Automated property ordering (7-group system)
- Prettier integration for consistent formatting

## Directory Structure

```
styles/
├── variables.css           # Design tokens and CSS variables
├── base.css               # Foundation styles, modal containers
├── components/            # Reusable UI components
├── dashboard/            # Dashboard-specific modules
├── features/             # Feature-specific styles
├── wizard/              # Template wizard system
├── responsive/          # Responsive design
└── utilities.css        # Utility classes
```

## Build System

### Concatenation Order
1. **Foundation**: `variables.css`, `base.css`
2. **Core Components**: buttons, forms, modals, navigation
3. **Feature Modules**: dashboard, wizard, specific features
4. **Responsive & Utilities**: mobile styles, utility classes

### Build Process
- `build-css.mjs` concatenates 22 files in dependency order
- Generates single `styles.css` with build metadata
- Watch mode for development workflow
- Integrated into main plugin build

## Component Organization

### Core Components (`components/`)
- **buttons.css**: Button variants and states
- **forms.css**: Form inputs, settings panels
- **modals.css**: Modal foundations and overlays
- **navigation.css**: Tab navigation, menu systems
- **settings.css**: Settings UI, management lists
- **metrics.css**: Metrics display components
- **journal-entry.css**: Journal entry specific styles

### Feature Modules
- **Dashboard** (`dashboard/`): Search, stats, tables, export
- **Wizard** (`wizard/`): Template creation workflow
- **Features** (`features/`): Callouts, export functionality

## Design System

### CSS Variables Structure
```css
:root {
  /* Spacing scale */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-xxl: 32px;

  /* Component sizing */
  --modal-width: 90vw;
  --modal-max-width: 1200px;
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
}
```

### Property Ordering System
Automated 7-group ordering via Stylelint:
1. **Display & Positioning**: `display`, `position`, `flex`, `grid`
2. **Box Model**: `width`, `height`, `padding`, `margin`, `border`
3. **Background & Shadow**: `background`, `box-shadow`
4. **Border Specifics**: `border-radius`, `outline`
5. **Typography**: `font`, `text-align`, `color`
6. **Interaction**: `cursor`, `overflow`, `pointer-events`
7. **Animation**: `transform`, `transition`, `animation`

## Modal System Architecture

### Container Strategy
Uses `:has()` pseudo-class for modal type detection:
```css
.modal:has(.sfp-journal-modal) {
  width: var(--modal-width);
  height: var(--modal-height);
}

.modal:has(.sfp-template-wizard-modal) {
  width: 900px;
  height: 700px;
}
```

### Layout Patterns
- Flexbox-based layouts for consistent alignment
- CSS Grid for complex dashboard layouts  
- Responsive design with CSS custom properties

## Quality Standards

### Naming Conventions
- **Prefix**: All classes use `sfp-` namespace
- **BEM-inspired**: `.sfp-component-element--modifier`
- **Semantic**: Names describe purpose, not appearance

### Browser Compatibility
- Modern CSS features (`:has()`, CSS Grid, Flexbox)
- CSS custom properties for theming
- Obsidian-specific theme integration

### Performance Considerations
- Single concatenated stylesheet (80.3 KB)
- Minimal selector specificity
- Efficient property ordering
- No CSS-in-JS runtime overhead

## Development Workflow

### Making Changes
1. Edit component files in `styles/` directory
2. Run `npm run build:css` to regenerate bundle
3. Changes automatically linted and formatted

### Adding Components
1. Create new CSS file in appropriate directory
2. Add to build order in `build-css.mjs`
3. Follow naming conventions and use design tokens

### Quality Checks
- `npm run lint:css` - CSS linting
- `npm run format` - Code formatting
- Automated property ordering on save

## Integration Points

### Obsidian Compatibility
- Uses Obsidian CSS variables for theming
- Respects user's theme preferences
- Modal system integrates with Obsidian's modal framework

### Plugin Architecture
- CSS classes match TypeScript component structure
- Wizard system aligns with modal state management
- Settings components match configuration architecture

---

This architecture ensures maintainable, scalable CSS that integrates seamlessly with the ScribeFlow plugin's TypeScript architecture and Obsidian's theming system.