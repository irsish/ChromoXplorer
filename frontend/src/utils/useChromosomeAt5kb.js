/**
 * useChromosomeAt5kb.js
 *
 * Lazily fetches the 5 kb resolution PDB text for a single chromosome via the
 * backend proxy.  The fetch fires only when `enabled` is true (i.e. when the
 * explorer enters level 3).  Results are cached in a ref keyed by
 * "cellName/chromosome" so navigating back to level 3 for the same chromosome
 * does not re-fetch.
 *
 * Returns:
 *   { pdbText: string | null, loading: boolean, error: string | null }
 */

import { useState, useEffect, useRef } from "react"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

// Maps component-convention chromosome IDs ("Chr1", "Chr23") to the MongoDB
// chromosome field format ("chr1", "chrX") expected by the backend route.
function componentIdToMongoKey(componentId) {
    const stripped = componentId.replace(/^Chr/i, "")
    if (stripped === "23") return "chrX"
    return `chr${stripped}`
}

export function useChromosomeAt5kb({ cellName, chromosomeId, enabled }) {
    const [pdbText, setPdbText] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(null)

    // Cache: "cellName/chromosomeId" → pdb text string
    const cache = useRef({})

    useEffect(() => {
        if (!enabled || !cellName || !chromosomeId) {
            return
        }

        const cacheKey = `${cellName}/${chromosomeId}`

        // Return cached result immediately — no loading flash
        if (cache.current[cacheKey]) {
            setPdbText(cache.current[cacheKey])
            setLoading(false)
            setError(null)
            return
        }

        let cancelled = false

        async function fetch5kb() {
            setLoading(true)
            setError(null)
            setPdbText(null)

            try {
                const mongoKey = componentIdToMongoKey(chromosomeId)
                const url      = `${API_BASE}/cells/${cellName}/chromosomes/${mongoKey}?resolution=5kb`
                const res      = await fetch(url)

                if (!res.ok) {
                    throw new Error(`Server returned ${res.status} for ${url}`)
                }

                const text = await res.text()

                if (cancelled) return

                cache.current[cacheKey] = text
                setPdbText(text)
            } catch (err) {
                if (cancelled) return
                console.error("useChromosomeAt5kb: fetch failed", err)
                setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetch5kb()
        return () => { cancelled = true }

    }, [enabled, cellName, chromosomeId])

    return { pdbText, loading, error }
}