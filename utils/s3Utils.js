// s3Utils.js
// Shared S3 helpers used by the admin controller.
// Centralises bucket config and low-level S3 operations so controllers
// only deal with business logic.

const {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3")
const { s3 } = require("../config/s3")

const BUCKET          = process.env.AWS_S3_BUCKET_NAME || "chromoxplorer"
const S3_CELLS_PREFIX = "cells"

// Builds a public URL for a given S3 key.
// Uses AWS_S3_BUCKET_URL env var if set, otherwise falls back to the
// default S3 virtual-hosted-style URL.
function s3ObjectUrl(key) {
  const base = process.env.AWS_S3_BUCKET_URL?.replace(/\/$/, "")
  if (base) return `${base}/${key}`
  const region = process.env.AWS_REGION || "us-east-1"
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`
}

// Uploads a single object to S3 with the given key and content type.
async function putS3Object(key, body, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

// Lists every object key under a given S3 prefix, paginating through
// results as needed to handle large buckets.
async function listAllObjectKeysUnderPrefix(prefix) {
  const keys = []
  let continuationToken
  do {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )
    for (const obj of out.Contents || []) {
      if (obj.Key) keys.push(obj.Key)
    }
    continuationToken = out.IsTruncated ? out.NextContinuationToken : undefined
  } while (continuationToken)
  return keys
}

// Deletes S3 objects in batches of 1000 (the AWS maximum per request).
// checked=false (default): best-effort, ignores AWS errors — use for internal rollbacks.
// checked=true: returns { ok, message } on the first AWS error — use for user-facing deletes.
async function deleteS3Keys(keys, { checked = false } = {}) {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000)
    const out = await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      })
    )
    if (checked && out.Errors?.length) {
      return { ok: false, message: out.Errors[0]?.Message || "Some objects could not be deleted." }
    }
  }
  return { ok: true }
}

module.exports = {
  BUCKET,
  S3_CELLS_PREFIX,
  s3ObjectUrl,
  putS3Object,
  listAllObjectKeysUnderPrefix,
  deleteS3Keys,
}
