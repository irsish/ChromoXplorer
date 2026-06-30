// useAnnotations.js
// Gene-keyed annotation hook.
//   Admin        → annotations persisted to MongoDB via the backend API
//   Regular user → annotations live in React session state only (cleared on refresh/logout)
//
// Parameters: { auth, cellName, chromosome }
// The hook fetches all annotations for the cell+chromosome pair so the caller
// can look up any gene without re-fetching on every gene change.

import { useState, useEffect, useCallback } from "react"
import { isAdminUser, getUserProfile } from "./authentication/authHelper"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

function authHeader(auth) {
  const token = auth?.user?.access_token
  if (!token) throw new Error("No access token available")
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

export function useAnnotations({ auth, cellName, chromosome }) {
  const isAdmin = isAdminUser(getUserProfile(auth))

  // ── Admin: API-backed state ──────────────────────────────────────────────────
  const [dbAnnotations, setDbAnnotations] = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)

  useEffect(() => {
    if (!isAdmin || !auth?.isAuthenticated || !cellName || !chromosome) {
      setDbAnnotations([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(
      `${API_BASE}/annotations?cellName=${encodeURIComponent(cellName)}&chromosome=${encodeURIComponent(chromosome)}`,
      { headers: authHeader(auth) }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(({ annotations: data }) => {
        if (!cancelled) setDbAnnotations(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [isAdmin, auth?.isAuthenticated, cellName, chromosome])

  // gene: { symbol, chromosome, start, end }
  const dbAdd = useCallback(async (gene, note) => {
    const body = JSON.stringify({
      cellName,
      chromosome: gene.chromosome,
      geneSymbol: gene.symbol,
      geneStart:  gene.start,
      geneEnd:    gene.end,
      note,
    })

    const res  = await fetch(`${API_BASE}/annotations`, {
      method:  "POST",
      headers: authHeader(auth),
      body,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to save annotation")

    setDbAnnotations((prev) => {
      const idx = prev.findIndex((a) => a.geneSymbol === data.annotation.geneSymbol)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = data.annotation; return next
      }
      return [...prev, data.annotation]
    })

    return data.annotation
  }, [auth, cellName])

  const dbDelete = useCallback(async (id) => {
    const res  = await fetch(`${API_BASE}/annotations/${id}`, {
      method:  "DELETE",
      headers: authHeader(auth),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to delete annotation")

    setDbAnnotations((prev) => prev.filter((a) => a._id !== id))
  }, [auth])

  // ── Regular user: session-only state ────────────────────────────────────────
  const [sessionAnnotations, setSessionAnnotations] = useState([])

  useEffect(() => {
    if (!isAdmin) setSessionAnnotations([])
  }, [isAdmin, cellName, chromosome])

  const sessionAdd = useCallback(async (gene, note) => {
    const annotation = {
      _id:        `session-${gene.symbol}`,
      cellName,
      chromosome: gene.chromosome,
      geneSymbol: gene.symbol,
      geneStart:  gene.start,
      geneEnd:    gene.end,
      note,
    }

    setSessionAnnotations((prev) => {
      const idx = prev.findIndex((a) => a.geneSymbol === gene.symbol)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = annotation; return next
      }
      return [...prev, annotation]
    })

    return annotation
  }, [cellName])

  const sessionDelete = useCallback(async (id) => {
    setSessionAnnotations((prev) => prev.filter((a) => a._id !== id))
  }, [])

  // ── Return the appropriate implementation ────────────────────────────────────
  if (isAdmin) {
    return { annotations: dbAnnotations, addAnnotation: dbAdd, deleteAnnotation: dbDelete, loading, error }
  }

  return {
    annotations:      sessionAnnotations,
    addAnnotation:    sessionAdd,
    deleteAnnotation: sessionDelete,
    loading:          false,
    error:            null,
  }
}
