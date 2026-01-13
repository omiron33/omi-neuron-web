import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { SceneManager, type SceneConfig } from '../scene/scene-manager';

export function useSceneManager(
  containerRef: RefObject<HTMLElement | null>,
  config: SceneConfig
): SceneManager | null {
  const [manager, setManager] = useState<SceneManager | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const sceneManager = new SceneManager(container, config);
    sceneManager.initialize();
    setManager(sceneManager);
    return () => {
      sceneManager.dispose();
      setManager(null);
    };
  }, [
    containerRef,
    config.backgroundColor,
    config.autoRotateEnabled,
    config.autoRotateSpeed,
    config.enableStarfield,
    config.starfieldCount,
    config.postprocessingEnabled,
    config.bloomEnabled,
    config.vignetteEnabled,
    config.colorGradeEnabled,
    config.fogEnabled,
    config.enable2DMode,
  ]);

  return manager;
}
