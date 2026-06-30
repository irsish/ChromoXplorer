/**
 * useCellData.js
 *
 * Fetches chromosome PDB file text, the AB-compartments BED text, and any
 * optional uploaded annotation tracks for a given cell via backend proxy routes.
 */

import { useState, useEffect } from "react"

const CHROMOSOME_COLORS = [
    "#6A4C93", "#1982C4", "#8AC926", "#FFCA3A", "#FF595E",
    "#4CC9F0", "#3A86FF", "#8338EC", "#FF006E", "#FB5607",
    "#2EC4B6", "#90DBF4", "#B5179E", "#F72585", "#4895EF",
    "#56CFE1", "#72EFDD", "#80ED99", "#FFD60A", "#F8961E",
    "#F3722C", "#43AA8B", "#577590",
]

const CHROMOSOME_IDS = [
    "Chr1",  "Chr2",  "Chr3",  "Chr4",  "Chr5",  "Chr6",  "Chr7",  "Chr8",
    "Chr9",  "Chr10", "Chr11", "Chr12", "Chr13", "Chr14", "Chr15", "Chr16",
    "Chr17", "Chr18", "Chr19", "Chr20", "Chr21", "Chr22", "Chr23",
]

function mongoKeyToComponentId(mongoKey) {
    const lower = mongoKey.toLowerCase()
    if (lower === "chr23x" || lower === "chrx") return "Chr23"
    const num = lower.replace("chr", "")
    return `Chr${num}`
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

export function useCellData(cellName, resolution = "1mb") {
    const [chromosomeMap,      setChromosomeMap]      = useState(null)
    const [abCompartmentsText, setAbCompartmentsText] = useState(null)
    const [annotationTracks,   setAnnotationTracks]   = useState({})
    const [loading,            setLoading]            = useState(false)
    const [error,              setError]              = useState(null)

    useEffect(() => {
        if (!cellName) {
            setChromosomeMap(null)
            setAbCompartmentsText(null)
            setAnnotationTracks({})
            setLoading(false)
            setError(null)
            return
        }

        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            setChromosomeMap(null)
            setAbCompartmentsText(null)
            setAnnotationTracks({})

            try {
                const metaRes = await fetch(`${API_BASE}/cells/${cellName}`)
                if (!metaRes.ok) throw new Error(`Backend returned ${metaRes.status}`)
                const meta = await metaRes.json()

                const chromosomePromises = meta.chromosomes.map(async (chr) => {
                    const res = await fetch(`${API_BASE}${chr.url}?resolution=${resolution}`)
                    if (!res.ok) throw new Error(`Fetch failed for ${chr.chromosome}: ${res.status}`)
                    const text = await res.text()
                    return { chromosome: chr.chromosome, text }
                })

                const abPromise = meta.abCompartmentsUrl
                    ? fetch(`${API_BASE}${meta.abCompartmentsUrl}`)
                        .then(async (res) => res.ok ? res.text() : null)
                    : Promise.resolve(null)

                const trackPromises = Object.entries(meta.annotationTracks ?? {}).map(async ([type, track]) => {
                    const res = await fetch(`${API_BASE}${track.url}`)
                    return { type, text: res.ok ? await res.text() : null }
                })

                const [chromosomeResults, bedText, trackResults] = await Promise.all([
                    Promise.all(chromosomePromises),
                    abPromise,
                    Promise.all(trackPromises),
                ])

                if (cancelled) return

                const map = {}
                chromosomeResults.forEach((result) => {
                    const componentId = mongoKeyToComponentId(result.chromosome)
                    const colorIndex  = CHROMOSOME_IDS.indexOf(componentId)
                    map[componentId] = {
                        data:  result.text,
                        color: CHROMOSOME_COLORS[colorIndex] ?? "#888888",
                    }
                })

                const tracks = {}
                trackResults.forEach(({ type, text }) => {
                    if (text) tracks[type] = text
                })

                setChromosomeMap(map)
                setAbCompartmentsText(bedText)
                setAnnotationTracks(tracks)
            } catch (err) {
                if (cancelled) return
                console.error("useCellData: fetch failed.", err)
                setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [cellName, resolution])

    return { chromosomeMap, abCompartmentsText, annotationTracks, loading, error }
}
