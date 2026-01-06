---
title: Theme Engine - Runtime Customization
status: completed
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:Theming'
assignees:
  - CodingAgent
depends_on:
  - task-4-1-neuronweb-component
---

# Task 4.5: Theme Engine

## Objective
Build a theme engine for runtime customization of visualization appearance.

## Requirements

### 1. ThemeEngine (`src/visualization/themes/theme-engine.ts`)

```typescript
interface NeuronWebTheme {
  // Colors
  colors: {
    background: string;
    domainColors: Record<string, string>;
    defaultDomainColor: string;
    edgeDefault: string;
    edgeActive: string;
    edgeSelected: string;
    labelText: string;
    labelBackground: string;
  };
  
  // Typography
  typography: {
    labelFontFamily: string;
    labelFontSize: number;
    labelFontWeight: string;
  };
  
  // Effects
  effects: {
    starfieldEnabled: boolean;
    starfieldColor: string;
    glowEnabled: boolean;
    glowIntensity: number;
  };
  
  // Animation
  animation: {
    focusDuration: number;
    transitionDuration: number;
    easing: string;
  };
}

class ThemeEngine {
  constructor(initialTheme?: Partial<NeuronWebTheme>);
  
  // Theme management
  getTheme(): NeuronWebTheme;
  setTheme(theme: Partial<NeuronWebTheme>): void;
  resetTheme(): void;
  
  // Individual updates
  setDomainColor(domain: string, color: string): void;
  setBackground(color: string): void;
  setLabelStyle(style: Partial<NeuronWebTheme['typography']>): void;
  
  // Presets
  applyPreset(preset: 'dark' | 'light' | 'custom'): void;
  
  // Events
  onThemeChange: (theme: NeuronWebTheme) => void;
  
  // Persistence
  saveToStorage(): void;
  loadFromStorage(): void;
}
```

### 2. Default Theme
```typescript
const DEFAULT_THEME: NeuronWebTheme = {
  colors: {
    background: '#020314',
    domainColors: {},
    defaultDomainColor: '#c0c5ff',
    edgeDefault: '#4d4d55',
    edgeActive: '#c6d4ff',
    edgeSelected: '#ffffff',
    labelText: '#ffffff',
    labelBackground: 'rgba(0, 0, 0, 0.8)',
  },
  typography: {
    labelFontFamily: 'system-ui, sans-serif',
    labelFontSize: 12,
    labelFontWeight: '500',
  },
  effects: {
    starfieldEnabled: true,
    starfieldColor: '#ffffff',
    glowEnabled: true,
    glowIntensity: 0.6,
  },
  animation: {
    focusDuration: 800,
    transitionDuration: 650,
    easing: 'easeInOut',
  },
};
```

### 3. Preset Themes
- [ ] Dark theme (default)
- [ ] Light theme
- [ ] High contrast theme
- [ ] Custom (user-defined)

### 4. API Integration
- [ ] Load theme from settings API
- [ ] Save theme changes to API
- [ ] Sync across sessions

### 5. React Hook

```typescript
function useNeuronTheme(): {
  theme: NeuronWebTheme;
  setTheme: (theme: Partial<NeuronWebTheme>) => void;
  setDomainColor: (domain: string, color: string) => void;
  applyPreset: (preset: string) => void;
  resetTheme: () => void;
};
```

## Deliverables
- [ ] `src/visualization/themes/theme-engine.ts`
- [ ] `src/visualization/themes/presets.ts`
- [ ] `src/visualization/hooks/useNeuronTheme.ts`
- [ ] Default theme constants

## Acceptance Criteria
- Theme changes apply immediately
- All visual aspects are themeable
- Presets work correctly
- Theme persists across sessions
- API sync works

## Notes
- Use CSS variables where possible
- Consider performance of frequent updates
- Validate color values
- Support CSS color formats (hex, rgb, hsl)


