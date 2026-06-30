// GenomicFeaturesPanel.jsx
// Toggle panel shown at L2 that lets the user overlay genomic feature types
// on the 3D chromosome structure.

import { useExplorer } from "../../context/ExplorerContext"

export const FEATURE_DEFS = [
  { type: "genes",      label: "Genes",       color: "#FFD700" },
  { type: "promoters",  label: "Promoters",   color: "#00E5FF" },
  { type: "regulatory", label: "Regulatory",  color: "#7CFC8A" },
  { type: "tads",       label: "TADs",        color: "#FF8C42", requiresTrack: true },
  { type: "exons",      label: "Exons",       color: "#FF69B4", requiresGene: true },
  { type: "introns",    label: "Introns",     color: "#C084FC", requiresGene: true },
]

const styles = {
  panel: {
    position:       "absolute",
    top:            "100px",
    left:           "20px",
    zIndex:         30,
    width:          "220px",
    background:     "rgba(10, 15, 30, 0.82)",
    backdropFilter: "blur(10px)",
    border:         "1px solid rgba(68, 221, 0, 0.35)",
    borderRadius:   "10px",
    padding:        "0.85rem 1rem",
    color:          "white",
    boxShadow:      "0 4px 20px rgba(0,0,0,0.5)",
    display:        "flex",
    flexDirection:  "column",
    gap:            "0.55rem",
  },
  title: {
    fontSize:      "0.85rem",
    fontWeight:    700,
    color:         "#44dd00",
    letterSpacing: "0.04em",
    marginBottom:  "0.1rem",
  },
  row: {
    display:    "flex",
    alignItems: "center",
    gap:        "0.5rem",
    cursor:     "pointer",
    userSelect: "none",
  },
  checkbox: {
    accentColor: "#44dd00",
    cursor:      "pointer",
    width:       "14px",
    height:      "14px",
  },
  dot: {
    width:        "10px",
    height:       "10px",
    borderRadius: "50%",
    flexShrink:   0,
  },
  label: {
    fontSize: "0.82rem",
    color:    "rgba(255,255,255,0.85)",
  },
  loading: {
    fontSize:   "0.72rem",
    color:      "rgba(255,255,255,0.4)",
    marginLeft: "auto",
  },
  dimmed: {
    opacity:        0.4,
    pointerEvents:  "none",
  },
}

export default function GenomicFeaturesPanel({
  loadingStates = {},
  availableTypes = null,
  docked = false,
}) {
  const { activeFeatureTypes, setActiveFeatureTypes, highlightedGene } = useExplorer()

  const panelStyle = docked
    ? {
        ...styles.panel,
        position: "static",
        top: "auto",
        left: "auto",
        zIndex: "auto",
        width: "100%",
      }
    : styles.panel

  function toggle(type) {
    setActiveFeatureTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div style={panelStyle}>
      <div style={styles.title}>Genomic Features</div>

      {FEATURE_DEFS.map(({ type, label, color, requiresGene, requiresTrack }) => {
        const missingGene = requiresGene && !highlightedGene
        const missingTrack = requiresTrack && availableTypes && !availableTypes.has(type)
        const disabled = missingGene || missingTrack
        const title = missingGene
          ? "Search for a gene first to enable this overlay"
          : missingTrack
            ? "This cell does not include that uploaded annotation track"
            : undefined

        return (
          <label
            key={type}
            style={{ ...styles.row, ...(disabled ? styles.dimmed : {}) }}
            title={title}
          >
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={activeFeatureTypes.has(type)}
              onChange={() => !disabled && toggle(type)}
              disabled={disabled}
            />
            <span style={{ ...styles.dot, background: color }} />
            <span style={styles.label}>{label}</span>
            {loadingStates[type] && (
              <span style={styles.loading}>loading...</span>
            )}
          </label>
        )
      })}
    </div>
  )
}
