// featureOverlap.js
// Maps genomic feature coordinate ranges to bin/atom indices so 3D views
// can highlight which structural elements overlap with a feature type.
//
// Genomic coordinates are 1-based (matching Ensembl convention).
// Bin indices are 0-based.

/**
 * Returns a Set<number> of 1 MB bin indices whose genomic range overlaps
 * with at least one feature.
 *
 * Bin i covers [i * binSizeBp + 1, (i + 1) * binSizeBp] (1-based, inclusive).
 */
export function getOverlappingBinIndices(features, binSizeBp = 1_000_000) {
  const result = new Set()
  for (const { start, end } of features) {
    if (start == null || end == null) continue
    const firstBin = Math.floor((start - 1) / binSizeBp)
    const lastBin  = Math.floor((end   - 1) / binSizeBp)
    for (let b = firstBin; b <= lastBin; b++) result.add(b)
  }
  return result
}

/**
 * Returns a Set<number> of atom indices (at atomResolutionBp resolution)
 * whose genomic range overlaps with at least one feature.
 *
 * Atom i covers [i * atomResolutionBp, (i + 1) * atomResolutionBp - 1].
 */
export function getOverlappingAtomIndices(features, atomResolutionBp = 5_000) {
  const result = new Set()
  for (const { start, end } of features) {
    if (start == null || end == null) continue
    const firstAtom = Math.floor((start - 1) / atomResolutionBp)
    const lastAtom  = Math.floor((end   - 1) / atomResolutionBp)
    for (let a = firstAtom; a <= lastAtom; a++) result.add(a)
  }
  return result
}
