# ChromoXplorer — Backend

Express.js REST API for ChromoXplorer. Handles user profile management, genomic dataset metadata, and S3 file access. Connects to MongoDB and runs on port 3000.

## Tech Stack

| | |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express 5 |
| Database | MongoDB 8 via Mongoose 8 |
| Storage | AWS S3 via @aws-sdk/client-s3 |
| Auth | Stateless — identity provided by AWS Cognito `sub` claim in requests |

## Structure

```
backend/
├── config/
│   └── s3.js               S3 client initialization
├── controllers/
│   ├── cellsController.js  Handlers for cell/dataset endpoints
│   └── usersController.js  Handlers for user profile endpoints
├── db/
│   └── mongo.js            MongoDB connection setup
├── models/
│   ├── cell.js             Mongoose schema for genomic datasets
│   └── user.js             Mongoose schema for user profiles
├── routes/
│   ├── cells.js            Cell route definitions
│   └── users.js            User route definitions
├── scripts/
│   └── set-cors.js         Applies CORS config to S3 bucket on startup
└── server.js               Entry point
```

## API Reference

### Health / Debug

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check — returns `{ status: "ok" }` |
| `GET` | `/test` | Simple string response for smoke testing |
| `GET` | `/db-test` | Reads from the test collection in MongoDB |

### Users — `/users`

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | Return all user records |
| `POST` | `/users` | Create a new user (called after first Cognito login) |
| `GET` | `/users/:sub` | Fetch a single user by their Cognito `sub` claim |
| `PATCH` | `/users/:sub` | Update profile fields and mark profile as completed |

**User document fields:**

| Field | Type | Description |
|---|---|---|
| `sub` | String | Cognito user ID (unique, indexed) |
| `email` | String | User email address |
| `location.city` | String | Optional city |
| `location.region` | String | Optional region/state |
| `location.country` | String | Optional country |
| `useCaseReason` | String | Why the user is using the platform |
| `preferences.theme` | `light` \| `dark` \| `system` | UI theme preference |
| `preferences.starfieldEnabled` | Boolean | Background starfield toggle |
| `optionalDataOptOut` | Boolean | Whether user opted out of optional data collection |
| `profileCompleted` | Boolean | Set to `true` after first-login profile completion |

### Cells — `/cells`

| Method | Path | Description |
|---|---|---|
| `GET` | `/cells` | Return all cell/dataset records |
| `GET` | `/cells/files` | Return all cell records including file metadata |
| `GET` | `/cells/:cellName` | Fetch a single cell by name |
| `GET` | `/cells/:cellName/chromosomes/:chromosome?resolution=1mb` | Get the S3 file for a specific chromosome at a given resolution (`1mb` or `5kb`, defaults to `1mb`) |
| `GET` | `/cells/:cellName/ab-compartments` | Get the A/B compartments file for a cell |

**Cell document fields:**

| Field | Type | Description |
|---|---|---|
| `cellName` | String | Unique identifier (lowercase, indexed) |
| `displayName` | String | Human-readable name |
| `description` | String | Dataset description |
| `abCompartmentsFile` | String | S3 URL for the A/B compartments data file |
| `chromosomes` | Array | List of chromosome file entries (see below) |

**Chromosome entry (in `/cells/:cellName` response):**

| Field | Type | Description |
|---|---|---|
| `chromosome` | String | Chromosome name (e.g., `chr1`, `chrX`) |
| `format` | String | File format (e.g., `pdb`) |
| `resolutions` | String[] | Available resolutions (e.g., `["1mb", "5kb"]`) |
| `url` | String | Backend proxy path — append `?resolution=` to select a file |

**Resolution file entry (`files[]`):**

| Field | Type | Description |
|---|---|---|
| `resolution` | String | Resolution label (e.g., `1mb`, `5kb`) |
| `s3Key` | String | S3 object key |
| `s3Url` | String | Full S3 URL |
| `size` | Number | File size in bytes |
| `version` | Number | File version number |
| `lastUpdated` | Date | Last update timestamp |

## Local Development (without Docker)

### Prerequisites

- Node.js 22+
- A running MongoDB instance (local or Atlas)

### Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (or in the project root):

```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chromoxplorer
CORS_ORIGIN=http://localhost:5173
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=YOUR_BUCKET_NAME
AWS_S3_BUCKET_URL=https://YOUR_BUCKET_NAME.s3.us-east-1.amazonaws.com
```

### Run

```bash
npm start       # starts server on port 3000
```

Verify the server is up:

```bash
curl http://localhost:3000/
# → {"status":"ok"}

curl http://localhost:3000/db-test
# → lists documents from the test collection
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | `development` enables verbose Express logging | `production` |
| `MONGODB_URI` | Full MongoDB connection string | `mongodb://user:pass@mongodb:27017/chromoxplorer?authSource=chromoxplorer` |
| `CORS_ORIGIN` | Comma-separated list of allowed origins | `http://localhost,https://yourdomain.com` |
| `AWS_ACCESS_KEY_ID` | IAM access key with S3 permissions | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key | `wJalrXUtnFEMI/K7MDENG/...` |
| `AWS_REGION` | AWS region for S3 | `us-east-1` |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | `chromoxplorer-datasets` |
| `AWS_S3_BUCKET_URL` | Full base URL to the S3 bucket | `https://chromoxplorer-datasets.s3.us-east-1.amazonaws.com` |

> In Docker-based deployments these are provided by the root `.env` file via `docker-compose.yml`. You do not need a separate `.env` in the `backend/` directory for Docker builds.

## Production Build (Docker)

The backend Dockerfile uses Node 22 Alpine with a non-root `node` user. It runs `npm ci` with cache mounts for a lean, reproducible image and starts the server with `npm start`.

See the root [README](../README.md) for full Docker deployment instructions.
