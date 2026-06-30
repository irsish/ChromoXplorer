// requireAuth.js
// Verifies a Cognito JWT (Bearer access token) and attaches the user's sub to
// req.user.  Does NOT require admin group membership — any authenticated user passes.

const { createRemoteJWKSet, jwtVerify } = require("jose")

let jwks = null

function getIssuer() {
  let raw = (process.env.COGNITO_ISSUER || "").trim()
  if (!raw) raw = (process.env.VITE_COGNITO_AUTHORITY || "").trim()
  if (!raw) {
    const region = (process.env.COGNITO_REGION || process.env.AWS_REGION || "").trim()
    const poolId = (process.env.COGNITO_USER_POOL_ID || "").trim()
    if (region && poolId)
      raw = `https://cognito-idp.${region}.amazonaws.com/${poolId}`
  }
  return raw.replace(/\/$/, "")
}

function getJWKS() {
  const issuer = getIssuer()
  if (!issuer) throw new Error("COGNITO_ISSUER is not configured")
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
  return jwks
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const token  = header.startsWith("Bearer ") ? header.slice(7).trim() : null

  if (!token) {
    return res.status(401).json({
      error:   "Unauthorized",
      message: "Send Authorization: Bearer <access_token>.",
    })
  }

  const issuer = getIssuer()
  if (!issuer) {
    console.error("requireAuth: set COGNITO_ISSUER or (COGNITO_REGION + COGNITO_USER_POOL_ID)")
    return res.status(500).json({ error: "Server misconfiguration" })
  }

  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer,
      algorithms:     ["RS256"],
      clockTolerance: "30s",
    })

    const clientId = process.env.COGNITO_CLIENT_ID
    if (clientId) {
      const forThisApp = payload.aud === clientId || payload.client_id === clientId
      if (!forThisApp) {
        return res.status(403).json({
          error:   "Forbidden",
          message: "Token was not issued for this application.",
        })
      }
    }

    req.user = { sub: payload.sub }
    return next()
  } catch (err) {
    console.warn("requireAuth JWT verify failed:", err.message)
    return res.status(401).json({
      error:   "Unauthorized",
      message: "Invalid or expired token.",
    })
  }
}

module.exports = { requireAuth }
