// Applies the CORS policy to the Lightsail/S3 bucket.
// Called automatically on server startup, or run manually:
//   node scripts/set-cors.js

// When run standalone, load env vars before the S3 client is initialized.
if (require.main === module) {
  require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") })
}

const { PutBucketCorsCommand, S3Client } = require("@aws-sdk/client-s3")

// Use dedicated admin credentials for bucket management if provided,
// otherwise fall back to the default S3 client (Lightsail object key).
function getAdminS3Client() {
  const keyId = process.env.AWS_ADMIN_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secret = process.env.AWS_ADMIN_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
  })
}

async function setCors() {
  const client = getAdminS3Client()
  const command = new PutBucketCorsCommand({
    Bucket: "chromoxplorer",
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET"],
          AllowedOrigins: [
            "https://dev.chromoxplorer.org",
            "https://chromoxplorer.org",
          ],
          ExposeHeaders: [],
        },
      ],
    },
  })

  await client.send(command)
  console.log("S3 CORS policy applied.")
}

module.exports = { setCors }

if (require.main === module) {
  setCors().catch((err) => {
    console.error("Failed to apply CORS policy:", err)
    process.exit(1)
  })
}
