/**
 * Cosine similarity between two equal-length vectors.
 * Returns a value in [-1, 1] (or 0 if degenerate).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0
  }
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  if (magA === 0 || magB === 0) {
    return 0
  }
  return dot / (magA * magB)
}

/** Map cosine [-1, 1] to [0, 1] for a friendly 0–1 score bar */
export function cosineToUnitInterval(cos: number): number {
  return Math.max(0, Math.min(1, (cos + 1) / 2))
}

/** Bands on raw cosine similarity (per MVP spec) */
export function interpretSimilarity(cos: number): string {
  if (cos >= 0.8) return 'Highly similar'
  if (cos >= 0.5) return 'Moderately similar'
  return 'Low similarity'
}
