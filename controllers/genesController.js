// genesController.js
// Proxies gene lookup requests to the Ensembl REST API so the frontend
// never needs to call an external service directly.
//
// Ensembl docs: https://rest.ensembl.org

const ENSEMBL_BASE = 'https://rest.ensembl.org'
const ENSEMBL_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

// Normalise the chromosome field returned by Ensembl.
// Ensembl returns bare numbers/letters ("17", "X") — we want "chr17", "chrX".
function normaliseChr(seqRegion) {
  if (!seqRegion) return null
  return seqRegion.startsWith('chr') ? seqRegion : `chr${seqRegion}`
}

// GET /genes/search?query=BRCA1
// Looks up a gene symbol in Ensembl and returns its genomic coordinates.
// Returns an array so the frontend can handle the response uniformly even
// though Ensembl's symbol lookup is exact-match only.
exports.searchGenes = async (req, res) => {
  const query = (req.query.query || '').trim()
  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' })
  }

  try {
    const url = `${ENSEMBL_BASE}/lookup/symbol/homo_sapiens/${encodeURIComponent(query)}?expand=0`
    const response = await fetch(url, { headers: ENSEMBL_HEADERS })

    // 400 / 404 from Ensembl means the symbol wasn't found — return empty list.
    if (response.status === 400 || response.status === 404) {
      return res.json({ genes: [] })
    }

    if (!response.ok) {
      throw new Error(`Ensembl responded with ${response.status}`)
    }

    const data = await response.json()

    const gene = {
      symbol:      data.display_name || query.toUpperCase(),
      chromosome:  normaliseChr(data.seq_region_name),
      start:       data.start,
      end:         data.end,
      strand:      data.strand,
      description: data.description ?? null,
      ensemblId:   data.id ?? null,
    }

    return res.json({ genes: [gene] })
  } catch (err) {
    console.error(`GET /genes/search error (query="${query}"):`, err)
    return res.status(500).json({ error: 'Gene lookup failed' })
  }
}

// GET /genes/:symbol
// Returns a single gene's coordinates. Useful when the frontend already
// knows the exact symbol and just needs the location.
exports.getGeneBySymbol = async (req, res) => {
  const { symbol } = req.params

  try {
    const url = `${ENSEMBL_BASE}/lookup/symbol/homo_sapiens/${encodeURIComponent(symbol)}?expand=0`
    const response = await fetch(url, { headers: ENSEMBL_HEADERS })

    if (response.status === 400 || response.status === 404) {
      return res.status(404).json({ error: `Gene "${symbol}" not found` })
    }

    if (!response.ok) {
      throw new Error(`Ensembl responded with ${response.status}`)
    }

    const data = await response.json()

    return res.json({
      symbol:      data.display_name || symbol.toUpperCase(),
      chromosome:  normaliseChr(data.seq_region_name),
      start:       data.start,
      end:         data.end,
      strand:      data.strand,
      description: data.description ?? null,
      ensemblId:   data.id ?? null,
    })
  } catch (err) {
    console.error(`GET /genes/${symbol} error:`, err)
    return res.status(500).json({ error: 'Gene lookup failed' })
  }
}
