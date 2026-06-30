// genomicFeaturesController.js
// Proxies genomic feature requests to Ensembl so the frontend never
// calls an external service directly.
//
// Supported types: genes | promoters | exons | introns | regulatory
//
// GET /genomic-features?chromosome=chr17&type=genes
// GET /genomic-features?chromosome=chr17&type=promoters
// GET /genomic-features?chromosome=chr17&type=regulatory
// GET /genomic-features?chromosome=chrX&type=exons&geneId=ENSG...
// GET /genomic-features?chromosome=chrX&type=introns&geneId=ENSG...

const ENSEMBL_BASE        = 'https://rest.ensembl.org'
const ENSEMBL_HEADERS     = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'ChromoXplorer/1.0',
}
const PROMOTER_WINDOW     = 2_000
const OVERLAP_WINDOW_BP   = 5_000_000
const ENSEMBL_RETRIES     = 3

// In-memory caches avoid repeatedly hitting Ensembl for the same chromosome-
// or gene-scoped requests within one backend process.
const featureCache = new Map()
const lengthCache  = new Map()
const inflightCache = new Map()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url, retries = ENSEMBL_RETRIES) {
  const res = await fetch(url, { headers: ENSEMBL_HEADERS })
  if (!res.ok) {
    if (res.status === 429 && retries > 0) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1_000
        : 600 * (ENSEMBL_RETRIES - retries + 1)
      await sleep(waitMs)
      return fetchJson(url, retries - 1)
    }
    throw new Error(`Ensembl responded with ${res.status}`)
  }
  return res.json()
}

// "chr17" -> "17", "chrX" -> "X", bare "17" passes through.
function toEnsemblChr(rawChr) {
  if (!rawChr) return null
  return rawChr.toLowerCase().replace(/^chr/, '')
}

async function getChromosomeLength(ensemblChr) {
  const cacheKey = `length:${ensemblChr}`
  if (lengthCache.has(cacheKey)) return lengthCache.get(cacheKey)

  const data = await fetchJson(`${ENSEMBL_BASE}/info/assembly/homo_sapiens/${encodeURIComponent(ensemblChr)}`)
  const length = Number(
    data?.length ??
    data?.seq_region_length ??
    data?.top_level_region?.length ??
    data?.top_level_region?.[0]?.length
  )

  if (!Number.isFinite(length) || length <= 0) {
    throw new Error(`Could not determine chromosome length for ${ensemblChr}`)
  }

  lengthCache.set(cacheKey, length)
  return length
}

async function fetchChromosomeOverlap(ensemblChr, feature) {
  const cacheKey = `overlap:${feature}:${ensemblChr}`
  if (featureCache.has(cacheKey)) return featureCache.get(cacheKey)
  if (inflightCache.has(cacheKey)) return inflightCache.get(cacheKey)

  const promise = (async () => {
    const chrLength = await getChromosomeLength(ensemblChr)
    const features = []

    for (let start = 1; start <= chrLength; start += OVERLAP_WINDOW_BP) {
      const end = Math.min(chrLength, start + OVERLAP_WINDOW_BP - 1)
      const url = `${ENSEMBL_BASE}/overlap/region/homo_sapiens/${ensemblChr}:${start}..${end}?feature=${feature}`
      const chunk = await fetchJson(url)
      if (Array.isArray(chunk)) features.push(...chunk)
    }

    featureCache.set(cacheKey, features)
    return features
  })()

  inflightCache.set(cacheKey, promise)
  try {
    return await promise
  } finally {
    inflightCache.delete(cacheKey)
  }
}

async function fetchEnsemblGenes(ensemblChr) {
  return fetchChromosomeOverlap(ensemblChr, 'gene')
}

async function fetchExpandedGene(geneId) {
  const cacheKey = `expanded-gene:${geneId}`
  if (featureCache.has(cacheKey)) return featureCache.get(cacheKey)
  if (inflightCache.has(cacheKey)) return inflightCache.get(cacheKey)

  const promise = (async () => {
    const url = `${ENSEMBL_BASE}/lookup/id/${encodeURIComponent(geneId)}?expand=1`
    for (let attempt = 0; attempt <= ENSEMBL_RETRIES; attempt += 1) {
      const res = await fetch(url, { headers: ENSEMBL_HEADERS })
      if (res.status === 400 || res.status === 404) return null
      if (res.status === 429 && attempt < ENSEMBL_RETRIES) {
        const retryAfter = Number(res.headers.get('retry-after'))
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1_000
          : 600 * (attempt + 1)
        await sleep(waitMs)
        continue
      }
      if (!res.ok) throw new Error(`Ensembl lookup responded with ${res.status}`)

      const gene = await res.json()
      featureCache.set(cacheKey, gene)
      return gene
    }
    throw new Error('Ensembl lookup retry limit reached')
  })()

  inflightCache.set(cacheKey, promise)
  try {
    return await promise
  } finally {
    inflightCache.delete(cacheKey)
  }
}

function chooseTranscript(gene) {
  const transcripts = Array.isArray(gene?.Transcript) ? gene.Transcript : []
  if (!transcripts.length) return null

  const canonicalId = gene.canonical_transcript || gene.canonical_transcript_id || null
  const canonical = transcripts.find(
    (tx) => tx.is_canonical || (canonicalId && tx.id === canonicalId)
  )
  if (canonical) return canonical

  return [...transcripts]
    .sort((a, b) => {
      const aSpan = Math.abs((a?.end ?? 0) - (a?.start ?? 0))
      const bSpan = Math.abs((b?.end ?? 0) - (b?.start ?? 0))
      return bSpan - aSpan
    })[0]
}

exports.getFeatures = async (req, res) => {
  const { chromosome, type, geneId } = req.query

  if (!chromosome || !type) {
    return res.status(400).json({ error: 'chromosome and type are required' })
  }

  const ensemblChr = toEnsemblChr(chromosome)
  if (!ensemblChr) {
    return res.status(400).json({ error: 'invalid chromosome value' })
  }

  try {
    switch (type) {
      case 'genes':
        return await handleGenes(res, ensemblChr)
      case 'promoters':
        return await handlePromoters(res, ensemblChr)
      case 'regulatory':
        return await handleRegulatory(res, ensemblChr)
      case 'exons':
      case 'introns': {
        if (!geneId) return res.status(400).json({ error: `geneId is required for type=${type}` })
        return type === 'exons'
          ? await handleExons(res, geneId)
          : await handleIntrons(res, geneId)
      }
      default:
        return res.status(400).json({
          error: `Unknown type "${type}". Use genes, promoters, regulatory, exons, or introns.`,
        })
    }
  } catch (err) {
    console.error(`GET /genomic-features error (chr=${chromosome} type=${type}):`, err.message)
    return res.status(500).json({ error: 'Feature lookup failed' })
  }
}

async function handleGenes(res, ensemblChr) {
  const raw = await fetchEnsemblGenes(ensemblChr)
  const features = raw.map((g) => ({
    name:  g.external_name || g.id || 'unknown',
    start: g.start,
    end:   g.end,
    type:  'gene',
  }))
  return res.json({ features })
}

async function handlePromoters(res, ensemblChr) {
  const raw = await fetchEnsemblGenes(ensemblChr)
  const features = raw.map((g) => {
    const tss = g.strand === -1 ? g.end : g.start
    return {
      name:  `${g.external_name || g.id} promoter`,
      start: Math.max(1, tss - PROMOTER_WINDOW),
      end:   tss + PROMOTER_WINDOW,
      type:  'promoter',
    }
  })
  return res.json({ features })
}

async function handleRegulatory(res, ensemblChr) {
  const raw = await fetchChromosomeOverlap(ensemblChr, 'regulatory')
  const features = raw.map((item) => ({
    name:    item.description || item.feature_type || item.id || 'regulatory element',
    start:   item.start,
    end:     item.end,
    type:    'regulatory',
    subtype: item.feature_type || null,
  }))
  return res.json({ features })
}

async function handleExons(res, geneId) {
  const gene = await fetchExpandedGene(geneId)
  if (!gene) return res.status(404).json({ error: `Gene ID "${geneId}" not found` })

  const seen = new Set()
  const features = []
  for (const transcript of gene.Transcript || []) {
    for (const exon of transcript.Exon || []) {
      const key = `${exon.start}-${exon.end}`
      if (seen.has(key)) continue
      seen.add(key)
      features.push({ name: exon.id, start: exon.start, end: exon.end, type: 'exon' })
    }
  }

  features.sort((a, b) => a.start - b.start)
  return res.json({ features })
}

async function handleIntrons(res, geneId) {
  const gene = await fetchExpandedGene(geneId)
  if (!gene) return res.status(404).json({ error: `Gene ID "${geneId}" not found` })

  const transcript = chooseTranscript(gene)
  const exons = [...(transcript?.Exon || [])].sort((a, b) => a.start - b.start)
  if (exons.length < 2) return res.json({ features: [] })

  const features = []
  for (let i = 0; i < exons.length - 1; i++) {
    const start = exons[i].end + 1
    const end   = exons[i + 1].start - 1
    if (end < start) continue

    features.push({
      name:         `${transcript.id || geneId}-intron-${i + 1}`,
      start,
      end,
      type:         'intron',
      transcriptId: transcript.id || null,
    })
  }

  return res.json({ features })
}
