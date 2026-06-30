import { useState, useEffect, useRef } from "react";
import { useExplorer } from "../../context/ExplorerContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const DEBOUNCE_MS = 400;

// Convert Ensembl chromosome notation ("chr17", "chrX") to the component-
// convention used as chromosomeMap keys ("Chr17", "Chr23").
function ensemblChrToComponentId(chr) {
    if (!chr) return null;
    const lower = chr.toLowerCase();
    if (lower === "chrx") return "Chr23";
    const num = lower.replace("chr", "");
    return `Chr${num}`;
}

export default function GeneSearch() {
    const { navigateToChromosome, setHighlightedGene, selectedCell, chromosomeMap } = useExplorer();
    const disabled = !selectedCell;

    const [query, setQuery]       = useState("");
    const [results, setResults]   = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const [open, setOpen]         = useState(false);

    const debounceRef = useRef(null);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside.
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search — fires after the user stops typing for DEBOUNCE_MS.
    useEffect(() => {
        const trimmed = query.trim();

        if (!trimmed) {
            setResults([]);
            setOpen(false);
            setError(null);
            return;
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/genes/search?query=${encodeURIComponent(trimmed)}`);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const data = await res.json();
                setResults(data.genes ?? []);
                setOpen(true);
            } catch (err) {
                console.error("Gene search error:", err);
                setError("Search failed.");
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    function handleSelect(gene) {
        // Convert "chr17" → "Chr17" to match chromosomeMap keys.
        const componentId = ensemblChrToComponentId(gene.chromosome);

        // Guard: chromosome must exist in the loaded cell dataset.
        if (!chromosomeMap?.[componentId]) {
            setResults([]);
            setError(`${gene.symbol} is on ${gene.chromosome}, which isn't available in this cell's dataset.`);
            setOpen(true);
            return;
        }

        // Navigate to the chromosome and transition to Level 2.
        navigateToChromosome(componentId);

        // Store full gene info so ABCompartmentView can render the marker
        // and so exon overlays can look up transcript structure via ensemblId.
        setHighlightedGene({
            symbol:     gene.symbol,
            chromosome: componentId,
            start:      gene.start,
            end:        gene.end,
            ensemblId:  gene.ensemblId ?? null,
        });

        setQuery(gene.symbol);
        setOpen(false);
    }

    function handleClear() {
        setQuery("");
        setResults([]);
        setHighlightedGene(null);
        setOpen(false);
    }

    return (
        <div ref={containerRef} style={styles.wrapper} className="geneSearchWrapper">
            <div style={styles.inputRow}>
                <input
                    type="text"
                    placeholder={disabled ? "Select a cell first…" : "Search gene…"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    style={{ ...styles.input, ...(disabled ? styles.inputDisabled : {}) }}
                    className="geneSearchInput"
                    disabled={disabled}
                />
                {query && (
                    <button onClick={handleClear} style={styles.clearBtn} title="Clear">
                        ✕
                    </button>
                )}
            </div>

            {open && (
                <div style={styles.dropdown}>
                    {loading && <div style={styles.item}>Searching…</div>}
                    {error   && <div style={{ ...styles.item, color: "#e63946" }}>{error}</div>}
                    {!loading && !error && results.length === 0 && (
                        <div style={styles.item}>No results for "{query.trim()}"</div>
                    )}
                    {!loading && results.map((gene) => (
                        <button
                            key={gene.ensemblId ?? gene.symbol}
                            style={styles.resultBtn}
                            onClick={() => handleSelect(gene)}
                        >
                            <span style={styles.symbol}>{gene.symbol}</span>
                            <span style={styles.loc}>{gene.chromosome} : {gene.start.toLocaleString()} – {gene.end.toLocaleString()}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    wrapper: {
        position: "relative",
        display:  "flex",
        flexDirection: "column",
    },
    inputRow: {
        display:    "flex",
        alignItems: "center",
    },
    input: {
        height:          "36px",
        padding:         "0 10px",
        borderRadius:    "17px",
        border:          "1px solid rgba(255,255,255,0.25)",
        background:      "rgba(255,255,255,0.1)",
        color:           "#fff",
        fontSize:        "14px",
        outline:         "none",
        width:           "clamp(120px, 15vw, 180px)",
    },
    inputDisabled: {
        opacity:  0.4,
        cursor:   "not-allowed",
    },
    clearBtn: {
        marginLeft:  "4px",
        background:  "none",
        border:      "none",
        color:       "rgba(255,255,255,0.6)",
        cursor:      "pointer",
        fontSize:    "14px",
        padding:     "0 4px",
        lineHeight:  "1",
    },
    dropdown: {
        position:        "absolute",
        top:             "calc(100% + 4px)",
        left:            0,
        minWidth:        "280px",
        background:      "rgba(20,20,30,0.95)",
        border:          "1px solid rgba(255,255,255,0.15)",
        borderRadius:    "8px",
        backdropFilter:  "blur(8px)",
        zIndex:          100,
        overflow:        "hidden",
    },
    item: {
        padding:  "8px 12px",
        color:    "rgba(255,255,255,0.6)",
        fontSize: "13px",
    },
    resultBtn: {
        display:        "flex",
        flexDirection:  "column",
        width:          "100%",
        padding:        "8px 12px",
        background:     "none",
        border:         "none",
        borderBottom:   "1px solid rgba(255,255,255,0.07)",
        cursor:         "pointer",
        textAlign:      "left",
        color:          "#fff",
    },
    symbol: {
        fontWeight: "600",
        fontSize:   "14px",
    },
    loc: {
        fontSize: "11px",
        color:    "rgba(255,255,255,0.5)",
        marginTop: "2px",
    },
};
