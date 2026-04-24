export function isOutOfScope(scores: number[], threshold: number): boolean {
  if (scores.length === 0) return true;
  return scores.every((s) => s < threshold);
}
