// parseIntervalTrack.js
// Parses a generic BED-like interval track into per-chromosome genomic ranges.

function normalizeTrackChromosomeKey(rawChr) {
    const stripped = String(rawChr || "").replace(/^chr/i, "").trim()
    if (!stripped) return null

    const upper = stripped.toUpperCase()
    if (upper === "X" || upper === "23" || upper === "23X") return "X"
    if (upper === "Y") return "Y"

    const num = stripped.match(/^\d+$/)
    return num ? String(parseInt(num[0], 10)) : upper
}

export function parseIntervalTrack(rawText, defaultType = "interval") {
    const trackMap = {}

    for (const line of String(rawText || "").split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("track") || trimmed.startsWith("browser")) {
            continue
        }

        const cols = trimmed.split(/\s+/)
        if (cols.length < 3) continue

        const chrKey = normalizeTrackChromosomeKey(cols[0])
        const start  = parseInt(cols[1], 10)
        const end    = parseInt(cols[2], 10)
        if (!chrKey || Number.isNaN(start) || Number.isNaN(end) || end < start) continue

        if (!trackMap[chrKey]) trackMap[chrKey] = []
        trackMap[chrKey].push({
            name:  cols[3] || null,
            start,
            end,
            type:  defaultType,
        })
    }

    for (const chrKey of Object.keys(trackMap)) {
        trackMap[chrKey].sort((a, b) => a.start - b.start)
    }

    return trackMap
}

export function getTrackIntervalsForChromosome(trackMap, componentChrId) {
    if (!trackMap || !componentChrId) return []

    const stripped = String(componentChrId).replace(/^Chr/i, "")
    const chrKey = stripped === "23" ? "X" : stripped
    return trackMap[chrKey] ?? []
}
