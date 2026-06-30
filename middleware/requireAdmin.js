// Verifies Cognito JWT (Bearer access or ID token) and requires admin membership/role.

const { createRemoteJWKSet, jwtVerify } = require("jose")

let jwks = null

/**
 * Issuer URL for Cognito JWTs. Prefer COGNITO_ISSUER; otherwise build from
 * COGNITO_REGION + COGNITO_USER_POOL_ID, or reuse VITE_COGNITO_AUTHORITY if set on the server.
 */
function getIssuer() {
  let raw = (process.env.COGNITO_ISSUER || "").trim()
  if (!raw) {
    raw = (process.env.VITE_COGNITO_AUTHORITY || "").trim()
  }
  if (!raw) {
    const region = (process.env.COGNITO_REGION || process.env.AWS_REGION || "").trim()
    const poolId = (process.env.COGNITO_USER_POOL_ID || "").trim()
    if (region && poolId) {
      raw = `https://cognito-idp.${region}.amazonaws.com/${poolId}`
    }
  }
  return raw.replace(/\/$/, "")
}

function getJWKS() {
  const issuer = getIssuer()
  if (!issuer) {
    throw new Error("COGNITO_ISSUER is not configured")
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
  }
  return jwks
}

function payloadIsAdmin(payload) {
  const adminGroup = (process.env.COGNITO_ADMIN_GROUP || "admin").trim() || "admin"
  const groups = payload["cognito:groups"]
  const normalizedGroups = Array.isArray(groups)
    ? groups
    : typeof groups === "string"
      ? [groups]
      : []

  return (
    payload.role === "admin" ||
    payload["custom:role"] === "admin" ||
    normalizedGroups.includes(adminGroup)
  )
}

/**
 * Express middleware: Authorization: Bearer <token>
 * Token must be a valid Cognito-issued JWT and carry admin group/role claims.
 */
async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Send Authorization: Bearer <access_token> (Cognito session token).",
    })
  }

  const issuer = getIssuer()
  if (!issuer) {
    console.error(
      "requireAdmin: set COGNITO_ISSUER or (COGNITO_REGION + COGNITO_USER_POOL_ID)"
    )
    return res.status(500).json({ error: "Server misconfiguration" })
  }

  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer,
      algorithms: ["RS256"],
      clockTolerance: "30s",
    })

    const clientId = process.env.COGNITO_CLIENT_ID
    if (clientId) {
      const forThisApp =
        payload.aud === clientId || payload.client_id === clientId
      if (!forThisApp) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Token was not issued for this application.",
        })
      }
    }

    if (!payloadIsAdmin(payload)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Admin access only. Your account must be in the admin group (or have admin role).",
      })
    }

    req.admin = {
      sub: payload.sub,
      username: payload.username || payload["cognito:username"] || null,
    }
    return next()
  } catch (err) {
    console.warn("requireAdmin JWT verify failed:", err.message)
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token.",
    })
  }
}

module.exports = { requireAdmin, payloadIsAdmin }
