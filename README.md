<div align="center">
  <img src="frontend/src/assets/images/logo.png" alt="ChromoXplorer Logo" width="120" />

  # ChromoXplorer
</div>

ChromoXplorer is an interactive, research-driven platform for exploring the three-dimensional organization of genomes. It lets users navigate genome structure across multiple levels of biological organization — from chromosome territories down to TADs and individual genes — with an emphasis on spatial context and scientific clarity.

## Why ChromoXplorer?

The genome is not a flat list of genes — it is a physical, three-dimensional structure, and that shape matters. How chromosomes fold, where they sit inside the nucleus, and which regions of DNA end up close to each other in 3D space all have direct consequences for how genes are regulated, how cells develop, and how diseases like cancer arise.

Most existing genome visualization tools were built around flat, linear representations: tracks, heatmaps, and tables. These formats are efficient for dense data but they make it difficult to reason spatially. A researcher looking at a 2D contact map has to mentally reconstruct the 3D structure it describes — a significant cognitive leap, especially for students or scientists coming to 3D genomics for the first time.

ChromoXplorer was built to close that gap. Rather than asking users to interpret abstract data, it puts them directly inside a spatial model of the genome. Users can:

- **See the nucleus as it actually behaves** — with chromosomes occupying distinct territories rather than floating freely
- **Navigate into a chromosome** and observe which regions are transcriptionally active (A compartments) versus condensed and silenced (B compartments)
- **Zoom further** into topologically associating domains (TADs), the structural units that constrain which genes can interact with which enhancers

This hierarchy mirrors how researchers actually think about 3D genome organization, and it makes the relationship between structure and function more intuitive to explore.

The platform is designed for two audiences: **researchers** who want a spatial context layer alongside their existing data workflows, and **students** encountering 3D genomics for the first time who benefit from an interactive, visual introduction before engaging with raw data formats.

## Features

- **3D Genome Visualization** powered by Three.js, with three hierarchical exploration levels:
  1. **Chromosome Territories** — nucleus-level view of chromosomes occupying distinct 3D regions
  2. **A/B Compartments** — zoomed chromosome view showing functionally distinct chromatin regions
  3. **TADs and Genes** — localized 3D structures with gene-level elements and interaction data
- **User Authentication** via AWS Cognito (OpenID Connect)
- **Dataset Management** — admin panel for uploading and managing genomic datasets stored in AWS S3
- **User Profiles** — preferences, themes, and account management
- **Responsive UI** built with React, Bootstrap, and Reactstrap

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Three.js (@react-three/fiber), React Router 7 |
| Backend | Node.js 22, Express 5 |
| Database | MongoDB 8 |
| Auth | AWS Cognito (OIDC) |
| Storage | AWS S3 |
| Web Server | Nginx (SSL termination + API proxy) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions → AWS Lightsail (Ubuntu) |

---

## Prerequisites

Before deploying, you will need:

- **Docker** and **Docker Compose** installed on your server
- An **AWS account** with:
  - A **Cognito User Pool** configured (see below)
  - An **S3 bucket** for genomic datasets
  - An **IAM user** with `s3:GetObject` and `s3:PutObject` permissions on the bucket
- An **SSL certificate** (e.g., from Let's Encrypt) if deploying with HTTPS
- A server running Ubuntu (AWS Lightsail recommended) with ports 80 and 443 open

---

## AWS Setup

### Cognito User Pool

1. In the AWS Console, go to **Cognito → User Pools** and create a new pool.
2. Under **App clients**, add a new app client. Note the **User Pool ID** and **App Client ID**.
3. Configure the **Allowed callback URLs** to include your domain (e.g., `https://yourdomain.com/callback`).
4. Your `VITE_COGNITO_AUTHORITY` will be: `https://cognito-idp.<region>.amazonaws.com/<UserPoolID>`

### S3 Bucket

1. Create an S3 bucket in your preferred region.
2. Configure a **bucket policy** or **CORS policy** to allow access from your domain.
3. Create an **IAM user** (or role) with programmatic access and attach a policy granting read/write on the bucket.
4. Save the **Access Key ID** and **Secret Access Key** — you will need these for the `.env` file.

---

## Environment Configuration

Copy `.env.example` to `.env` in the project root and fill in all values:

```bash
cp .env.example .env
```

### Variable Reference

#### Core

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Set to `production` for AWS deployments | `production` |

#### MongoDB

| Variable | Description | Example |
|---|---|---|
| `MONGO_ROOT_USERNAME` | Root admin username for the MongoDB container | `admin` |
| `MONGO_ROOT_PASSWORD` | Root admin password — use a strong, unique value | `SuperStr0ngPw!` |
| `MONGO_BACKEND_USER` | App-level DB user (readWrite on `chromoxplorer` only) | `chromox_backend` |
| `MONGO_BACKEND_PASSWORD` | Password for the app DB user | `AnotherStr0ng!Pw` |
| `MONGODB_URI` | Full connection string — must match the two credentials above | `mongodb://chromox_backend:AnotherStr0ng!Pw@mongodb:27017/chromoxplorer?authSource=chromoxplorer` |

> **Note:** `mongo-init.js` automatically creates the backend user on first container start. Never reuse `MONGO_ROOT_PASSWORD` for `MONGO_BACKEND_PASSWORD`.

#### CORS & API URL

| Variable | Description | Example |
|---|---|---|
| `CORS_ORIGIN` | Comma-separated list of origins allowed to call the backend API | `http://localhost,https://yourdomain.com` |
| `VITE_API_BASE_URL` | The URL the browser uses to reach the backend. On AWS, use your server IP or domain | `https://yourdomain.com` |

> **Note:** In **production and dev-server** deployments, `VITE_API_BASE_URL` and all other `VITE_*` variables are baked into the frontend at **build time** as Docker build args. Changing them requires rebuilding the image (`docker compose up --build`). In **local development** (via `docker-compose.override.yml`), they are passed as runtime environment variables to the Vite dev server, so you can update `.env` and restart the container without a full rebuild.

#### AWS Cognito

| Variable | Description | Example |
|---|---|---|
| `VITE_COGNITO_AUTHORITY` | Cognito authority URL | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbCdEfGhI` |
| `VITE_COGNITO_CLIENT_ID` | App Client ID from your Cognito User Pool | `1abc2defgh3ijklmno4pqrst` |

#### AWS S3

| Variable | Description | Example |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key with S3 permissions | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | Region where your S3 bucket lives | `us-east-1` |
| `AWS_S3_BUCKET_NAME` | Name of your S3 bucket | `chromoxplorer-datasets` |
| `AWS_S3_BUCKET_URL` | Full base URL to your S3 bucket | `https://chromoxplorer-datasets.s3.us-east-1.amazonaws.com` |

---

## Deployment

### Local Development

Uses HTTP only (no SSL required). `docker-compose.override.yml` is applied automatically by Docker Compose and switches the frontend from the nginx static build to Vite's dev server, which supports Hot Module Replacement (HMR).

```bash
# Start all services and watch frontend source files for changes (recommended)
docker compose up --watch

# Start without file watching (builds the Vite dev server image but no HMR sync)
docker compose up --build -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

The app will be available at `http://localhost`.

When running with `--watch`, any file saved under `frontend/src/` or `frontend/public/` is synced into the running container and Vite's HMR updates the browser instantly without a restart. Saving `frontend/package.json` triggers a full container rebuild to install new dependencies.

### Production (AWS / Ubuntu Server)

Production deployment uses `docker-compose.prod.yml` which enables HTTPS on port 443, mounts the `chromoxplorer.org` certificate files, and bind-mounts `/var/www/certbot` so Certbot HTTP-01 challenges can be served through the frontend container. SSL certificates must be present on the host before starting.

#### 1. Obtain SSL Certificates (Let's Encrypt)

```bash
sudo apt install certbot
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
sudo certbot certonly --webroot -w /var/www/certbot -d yourdomain.com
```

Certificates will be placed in `/etc/letsencrypt/live/yourdomain.com/`.

If the app is already running in Docker, make sure the frontend container includes the `/var/www/certbot:/var/www/certbot:ro` bind mount from `docker-compose.prod.yml` before requesting or renewing the certificate. Otherwise Let's Encrypt will receive `404` for the ACME challenge files.

#### 2. Copy project files to the server

```bash
scp -r . ubuntu@<server-ip>:/home/ubuntu/apps/prod
```

Or use the included GitHub Actions workflow (see CI/CD below).

#### 3. Set up the `.env` file on the server

```bash
# On the server
cd /home/ubuntu/apps/prod
cp .env.example .env
nano .env   # fill in all production values
```

#### 4. Start the stack

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

The app will be available at `https://yourdomain.com`.

#### Useful commands

```bash
# View running containers
docker compose ps

# Tail logs for a specific service
docker compose logs -f backend

# Restart a single service after a config change
docker compose restart backend

# Full rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Stop and remove containers (data volume is preserved)
docker compose down

# Stop and remove everything including the database volume (destructive!)
docker compose down -v
```

---

## CI/CD (GitHub Actions)

The repository includes two workflows that automatically deploy on push:

| Workflow | Trigger | Target |
|---|---|---|
| `deploy-dev.yml` | Push to `dev` branch | Dev server (`DEV_HOST`) using `docker-compose.dev.yml` |
| `deploy-prod.yml` | Push to `main` branch | Prod server (`PROD_HOST`) using `docker-compose.prod.yml` |

Each workflow copies changed files to the server via SCP and runs `docker compose up -d --build` with the environment-specific override file for that target.

### Required GitHub Secrets

Set these in your repository under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `DEV_HOST` | IP or hostname of the dev server |
| `PROD_HOST` | IP or hostname of the production server |
| `SSH_USER` | SSH username (e.g., `ubuntu`) |
| `DEPLOY_KEY` | Private SSH key for the server |

> The `.env` file must already exist on the server — the workflows do **not** copy it (to avoid committing secrets).

---

## Project Structure

```
S26-Project3/
├── backend/            Express API (port 3000)
│   ├── controllers/    Route handlers (cells, users)
│   ├── models/         Mongoose schemas
│   ├── routes/         Express routers
│   └── server.js       Entry point
├── frontend/           React SPA
│   ├── src/
│   │   ├── components/ UI components (3D, Explorer, Account, Admin, Layout)
│   │   ├── context/    AuthContext, ExplorerContext
│   │   ├── pages/      Route-level page components
│   │   └── utils/      File parsers, math helpers, presets
│   ├── Dockerfile      Multi-stage: builder → runtime (nginx) and dev (Vite dev server)
│   └── nginx.conf      Nginx config used in the runtime stage (prod/dev-server deployments)
├── .env.example        Environment variable template
├── docker-compose.yml          Base Compose config (shared by all environments)
├── docker-compose.override.yml Auto-loaded locally — runs Vite dev server with HMR and Docker watch
├── docker-compose.dev.yml      Dev server overrides — mounts SSL certs for dev.chromoxplorer.org
├── docker-compose.prod.yml     Production overrides — mounts SSL certs for chromoxplorer.org
└── mongo-init.js       MongoDB initialization script (creates app user)
```
