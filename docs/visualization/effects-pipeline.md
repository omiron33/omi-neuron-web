# Effects Pipeline Design

## Minimal Effects Set

1. **Bloom** – soft glow on bright nodes/edges
2. **Vignette** – subtle darkening toward edges
3. **Color Grade** – mild contrast/temperature shift for depth

## Gating by Mode

| Mode | Bloom | Vignette | Color Grade |
| --- | --- | --- | --- |
| normal | On (configurable) | On (subtle) | On (light) |
| degraded | Off | Off | Off |
| fallback | Off | Off | Off |

## Integration Point

- `SceneManager` owns the EffectComposer instance.
- Composer renders only when `effects.postprocessingEnabled` is true.
- Fallback: if composer not available, render directly via WebGLRenderer.

## Proposed Dependencies

From `three/examples/jsm/postprocessing`:
- `EffectComposer`
- `RenderPass`
- `UnrealBloomPass`
- `ShaderPass`
- `GammaCorrectionShader`

Optional vignette shader can be custom (lightweight) or reused from a minimal shader pass.

## Config Controls (Proposed)

```ts
export interface NeuronWebTheme['effects'] {
  postprocessingEnabled: boolean;
  bloomEnabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  vignetteEnabled: boolean;
  vignetteDarkness: number;
  vignetteOffset: number;
  colorGradeEnabled: boolean;
  colorGradeIntensity: number;
}
```

## Fallback Behavior

- If performance mode is `degraded` or `fallback`, force `postprocessingEnabled = false`.
- If reduced motion is enabled, keep postprocessing optional but lower bloom intensity.
- Always render a base scene even if effect setup fails.
