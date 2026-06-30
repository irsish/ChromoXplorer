// useGenomicFeatures.js
// Fetches genomic annotation features (genes, promoters, regulatory, exons,
// introns) from the backend /genomic-features endpoint.
//
// Parameters:
//   chromosome - component convention ("Chr17", "Chr23") or null
//   type       - "genes" | "promoters" | "regulatory" | "exons" | "introns"
//   geneId     - Ensembl stable ID, required when type === "exons" | "introns"
//   enabled    - false suppresses the fetch entirely

import { useState, useEffect } from "react"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

function toApiChromosome(componentChr) {
  if (!componentChr) return null
  const lower = componentChr.toLowerCase()
  if (lower === "chr23") return "chrX"
  return lower
}

export function useGenomicFeatures({ chromosome, type, geneId = null, enabled = true }) {
  const [features, setFeatures] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const apiChr = toApiChromosome(chromosome)

  useEffect(() => {
    if (!enabled || !apiChr || !type) {
      setFeatures([])
      return
    }

    if ((type === "exons" || type === "introns") && !geneId) {
      setFeatures([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ chromosome: apiChr, type })
    if (geneId) params.set("geneId", geneId)

    fetch(`${API_BASE}/genomic-features?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(({ features: data }) => {
        if (!cancelled) setFeatures(data ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [enabled, apiChr, type, geneId])

  return { features, loading, error }
}
