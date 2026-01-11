export const dotProduct = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
  }
  return dot;
};

export const l2Norm = (vector: number[]): number => {
  let sum = 0;
  for (let i = 0; i < vector.length; i += 1) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
};

export const normalizeVector = (vector: number[]): number[] => {
  const norm = l2Norm(vector);
  if (norm === 0) return vector.map(() => 0);
  return vector.map((value) => value / norm);
};

