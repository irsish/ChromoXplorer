// adminApi.js
// API functions for admin cell management.
// All write operations require a valid Cognito access token from an admin user.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

// GET /cells — returns all cells registered in the database.
export async function fetchCells() {
  const res = await fetch(`${API_BASE}/cells`)
  if (!res.ok) throw new Error("Failed to fetch cells")
  return res.json()
}

// POST /admin/cells/upload — extracts a zip and registers the cell in the database.
// Throws with the backend error message if the upload fails.
export async function uploadCell(cellName, description, file, token) {
  const body = new FormData()
  body.append("cellName", cellName)
  body.append("description", description)
  body.append("file", file)

  const res = await fetch(`${API_BASE}/admin/cells/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || "Upload failed")
  return data
}

// DELETE /admin/cells/:cellName — removes all S3 objects and the Cell document from MongoDB.
// Throws with the backend error message if the delete fails.
export async function deleteCell(cellName, token) {
  const res = await fetch(`${API_BASE}/admin/cells/${encodeURIComponent(cellName)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || "Delete failed")
  return data
}
