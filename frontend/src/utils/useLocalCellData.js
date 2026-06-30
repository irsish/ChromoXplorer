/**
 * useLocalCellData.js
 *
 * Mirrors the return shape of useCellData exactly so ExplorerPageContent
 * can swap between remote and local mode with a single conditional.
 *
 * Expected shape:
 * {
 *   chromosomeMap:      { [chrId: string]: { data: string, color: string } },
 *   abCompartmentsText: string | null,
 *   annotationTracks:   { [type: string]: string },
 * }
 */

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

const TRACK_DEFS = [
    {
        type: "tads",
        score(name) {
            let score = 0
            if (/[/\\]tracks[/\\]/i.test(name)) score += 2
            if (/(^|[^a-z])(tad|tads|domain|domains)([^a-z]|$)/i.test(name)) score += 6
            return score
        },
    },
    {
        type: "regulatory",
        score(name) {
            let score = 0
            if (/[/\\]tracks[/\\]/i.test(name)) score += 2
            if (/(regulatory|enhancer|enhancers|silencer|silencers|ccre|cres)/i.test(name)) score += 6
            return score
        },
    },
]

function stemToComponentId(stem) {
    const lower = stem.toLowerCase().replace(/[_\-\s]/g, "")
    if (lower === "chr23x" || lower === "chrx") return "Chr23"
    const match = lower.match(/(?:chromosome|chr)(\d+)/)
    if (!match) return null
    return `Chr${match[1]}`
}

function pickBestBedFile(files, scorer, { fallbackToFirst = false } = {}) {
    const ranked = files
        .map((file) => ({ file, score: scorer(file.name) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)

    if (ranked.length) return ranked[0].file
    return fallbackToFirst ? files[0] ?? null : null
}

function abBedScore(name) {
    let score = 0
    if (/ab|compartment/i.test(name)) score += 6
    if (!/[/\\]tracks[/\\]/i.test(name)) score += 1
    return score
}

export async function parseLocalZip(zip) {
    const chromosomeMap      = {}
    const annotationTracks   = {}
    let   abCompartmentsText = null

    const files = Object.values(zip.files)
    const bedFiles = files.filter((f) => !f.dir && f.name.toLowerCase().endsWith(".bed"))

    const abBedFile = pickBestBedFile(bedFiles, abBedScore, { fallbackToFirst: bedFiles.length === 1 })
    if (abBedFile) {
        abCompartmentsText = await abBedFile.async("string")
    }

    for (const def of TRACK_DEFS) {
        const match = pickBestBedFile(
            bedFiles.filter((file) => file !== abBedFile),
            def.score
        )
        if (match) {
            annotationTracks[def.type] = await match.async("string")
        }
    }

    const pdbFiles = files.filter(
        (f) =>
            !f.dir &&
            f.name.toLowerCase().endsWith(".pdb") &&
            /[/\\]1mb[/\\]/i.test(f.name)
    )

    await Promise.all(
        pdbFiles.map(async (f) => {
            const parts = f.name.replace(/\\/g, "/").split("/")
            const stem  = parts[parts.length - 1].replace(/\.pdb$/i, "")
            const id    = stemToComponentId(stem)
            if (!id) return

            const text       = await f.async("string")
            const colorIndex = CHROMOSOME_IDS.indexOf(id)
            chromosomeMap[id] = {
                data:  text,
                color: CHROMOSOME_COLORS[colorIndex] ?? "#888888",
            }
        })
    )

    return { chromosomeMap, abCompartmentsText, annotationTracks }
}

export async function getLocal5kbText(zip, chromosomeId) {
    if (!zip || !chromosomeId) return null

    const num  = chromosomeId.replace("Chr", "")
    const stem = num === "23" ? "chrx" : `chr${num}`

    const files = Object.values(zip.files)
    const match = files.find(
        (f) =>
            !f.dir &&
            f.name.toLowerCase().endsWith(".pdb") &&
            /[/\\]5kb[/\\]/i.test(f.name) &&
            f.name.toLowerCase().replace(/\.pdb$/, "").split(/[/\\]/).pop() === stem
    )

    if (!match) return null
    return match.async("string")
}
