// AnnotationPanel.jsx
// Shown at Level 3 when a gene is searched and the user is authenticated.
// Lets the user write and save a note for the currently highlighted gene.

import { useState, useEffect } from "react"

const PANEL_WIDTH = 280

const styles = {
  panel: {
    position:       "absolute",
    top:            "100px",
    right:          "20px",
    zIndex:         30,
    width:          `${PANEL_WIDTH}px`,
    background:     "rgba(10, 15, 30, 0.82)",
    backdropFilter: "blur(10px)",
    border:         "1px solid rgba(68, 221, 0, 0.35)",
    borderRadius:   "10px",
    padding:        "1rem 1.1rem",
    color:          "white",
    boxShadow:      "0 4px 20px rgba(0,0,0,0.5)",
    display:        "flex",
    flexDirection:  "column",
    gap:            "0.65rem",
  },
  title: {
    fontSize:      "0.95rem",
    fontWeight:    700,
    color:         "#44dd00",
    letterSpacing: "0.03em",
  },
  geneSymbol: {
    fontSize:   "1.15rem",
    fontWeight: 700,
    color:      "white",
    letterSpacing: "0.04em",
  },
  meta: {
    fontSize:   "0.8rem",
    color:      "rgba(255,255,255,0.6)",
    lineHeight: 1.5,
  },
  metaValue: {
    color:      "rgba(255,255,255,0.9)",
    fontWeight: 500,
  },
  divider: {
    height:     "1px",
    background: "rgba(255,255,255,0.1)",
  },
  existingLabel: {
    fontSize: "0.78rem",
    color:    "rgba(255,255,255,0.45)",
  },
  existingNote: {
    fontSize:     "0.82rem",
    color:        "rgba(255,255,255,0.75)",
    fontStyle:    "italic",
    padding:      "0.4rem 0.6rem",
    background:   "rgba(68,221,0,0.08)",
    borderRadius: "6px",
    border:       "1px solid rgba(68,221,0,0.2)",
    lineHeight:   1.45,
    whiteSpace:   "pre-wrap",
    wordBreak:    "break-word",
  },
  textarea: {
    width:       "100%",
    background:  "rgba(255,255,255,0.07)",
    border:      "1px solid rgba(255,255,255,0.18)",
    borderRadius: "6px",
    color:       "white",
    fontSize:    "0.85rem",
    padding:     "0.55rem 0.7rem",
    resize:      "vertical",
    minHeight:   "90px",
    outline:     "none",
    fontFamily:  "inherit",
    lineHeight:  1.5,
    boxSizing:   "border-box",
  },
  row: {
    display:    "flex",
    gap:        "0.5rem",
    alignItems: "center",
  },
  saveBtn: {
    background:    "#44dd00",
    color:         "#000",
    border:        "none",
    borderRadius:  "6px",
    fontWeight:    700,
    fontSize:      "0.85rem",
    padding:       "0.45rem 0.9rem",
    cursor:        "pointer",
    letterSpacing: "0.02em",
  },
  deleteBtn: {
    background:   "transparent",
    color:        "#ff5555",
    border:       "1px solid rgba(255,85,85,0.45)",
    borderRadius: "6px",
    fontSize:     "0.82rem",
    padding:      "0.4rem 0.7rem",
    cursor:       "pointer",
  },
  statusMsg: {
    fontSize: "0.78rem",
  },
}

export default function AnnotationPanel({
  gene,
  cellName,
  annotations,
  addAnnotation,
  deleteAnnotation,
}) {
  const [note, setNote]         = useState("")
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage]   = useState(null)  // { text, ok }

  // Find existing annotation for this gene.
  const existing = annotations?.find((a) => a.geneSymbol === gene?.symbol) ?? null

  // Pre-fill textarea when gene or existing annotation changes.
  useEffect(() => {
    setNote(existing?.note ?? "")
    setMessage(null)
  }, [gene?.symbol])

  if (!gene) return null

  const rangeMb = gene.start != null
    ? `${(gene.start / 1e6).toFixed(2)}–${(gene.end / 1e6).toFixed(2)} Mb`
    : "—"

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      await addAnnotation(gene, note)
      setMessage({ text: "Saved!", ok: true })
    } catch (err) {
      setMessage({ text: err.message, ok: false })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existing) return
    setDeleting(true)
    setMessage(null)
    try {
      await deleteAnnotation(existing._id)
      setNote("")
      setMessage({ text: "Annotation removed.", ok: true })
    } catch (err) {
      setMessage({ text: err.message, ok: false })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={styles.panel}>
      <div style={styles.title}>Gene Annotation</div>

      <div style={styles.geneSymbol}>{gene.symbol}</div>

      <div style={styles.meta}>
        <div>Cell: <span style={styles.metaValue}>{cellName}</span></div>
        <div>Chromosome: <span style={styles.metaValue}>{gene.chromosome}</span></div>
        <div>Range: <span style={styles.metaValue}>{rangeMb}</span></div>
      </div>

      <div style={styles.divider} />

      {existing && (
        <>
          <div style={styles.existingLabel}>Saved note:</div>
          <div style={styles.existingNote}>
            {existing.note || <em style={{ opacity: 0.5 }}>No note text.</em>}
          </div>
        </>
      )}

      <textarea
        style={styles.textarea}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Add a note about ${gene.symbol}…`}
        maxLength={2000}
      />

      <div style={styles.row}>
        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : existing ? "Update" : "Save"}
        </button>

        {existing && (
          <button style={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
            {deleting ? "Removing…" : "Remove"}
          </button>
        )}

        {message && (
          <span style={{ ...styles.statusMsg, color: message.ok ? "#44dd00" : "#ff5555" }}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  )
}
