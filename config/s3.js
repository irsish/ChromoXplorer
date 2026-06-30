// s3.js
// Initializes and exports a shared S3 client instance.
// AWS credentials are loaded from environment variables (see .env.example).
// Import this wherever you need to interact with the chromoxplorer S3 bucket.

const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

module.exports = { s3 };