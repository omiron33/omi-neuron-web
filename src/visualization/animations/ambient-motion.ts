export function computeAmbientDrift(
  elapsed: number,
  phase: number,
  speed: number,
  amplitude: number
): { x: number; y: number; z: number } {
  const drift = Math.sin(elapsed * speed + phase) * amplitude;
  const driftX = Math.cos(elapsed * speed * 0.6 + phase) * amplitude * 0.45;
  const driftZ = Math.sin(elapsed * speed * 0.4 + phase) * amplitude * 0.35;
  return { x: driftX, y: drift, z: driftZ };
}
