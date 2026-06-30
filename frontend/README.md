# ChromoXplorer — Frontend

React 19 single-page application for interactive 3D genome visualization. Built with Vite, Three.js, and AWS Cognito authentication.

## Tech Stack

| | |
|---|---|
| Framework | React 19, React Router 7 |
| Build tool | Vite 7 |
| 3D rendering | Three.js via @react-three/fiber + @react-three/drei |
| Auth | AWS Cognito (OIDC) via react-oidc-context |
| UI | Bootstrap 5, Reactstrap |
| Web server | Nginx (production) |

## Structure

```
src/
├── components/
│   ├── Account/        User profile and settings UI
│   ├── Admin/          Dataset management panel
│   ├── Authentication/ Auth callback handler
│   ├── Explorer/       Visualization controls and toolbar
│   ├── Genome3D/       Three.js scene components (territories, A/B compartments, TADs)
│   └── Layout/         NavBar, Footer, page wrapper
├── context/
│   ├── AuthContext.jsx     Authentication state
│   └── ExplorerContext.jsx 3D scene state and zoom-level logic
├── pages/              Route-level page components
└── utils/
    ├── authentication/ Auth helpers
    ├── generation/     Data generation utilities
    ├── math/           Geometric and averaging helpers
    ├── parsing/        PDB, genome file, and A/B compartment parsers
    └── presets/        Save/load visualization states
```

## Local Development (without Docker)

### Prerequisites

- Node.js 22+
- The backend running on `http://localhost:3000` (see [backend README](../backend/README.md))

### Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file (Vite loads this automatically in dev):

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_COGNITO_AUTHORITY=https://cognito-idp.us-east-1.amazonaws.com/YOUR_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_APP_CLIENT_ID
VITE_SUPPORT_EMAIL=support@chromoxplorer.com
```

### Run

```bash
npm run dev        # start dev server with HMR at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
npm run lint       # run ESLint
```

## Environment Variables

All frontend environment variables are prefixed with `VITE_` and are **baked into the bundle at build time**. Changing them requires a rebuild.

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL for all backend API calls | `http://localhost:3000` (dev) / `https://yourdomain.com` (prod) |
| `VITE_COGNITO_AUTHORITY` | Cognito authority URL | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbCdEfG` |
| `VITE_COGNITO_CLIENT_ID` | Cognito App Client ID | `1abc2defgh3ijklmno4pqrst` |
| `VITE_SUPPORT_EMAIL` | Contact email shown on Support, Terms, and Privacy pages | `support@chromoxplorer.com` |

> In Docker-based deployments these are passed as build args in `docker-compose.yml` and sourced from the root `.env` file. You do not need a separate `.env` in the frontend directory for Docker builds.

## Production Build (Docker)

The frontend is built and served via a two-stage Dockerfile:

1. **Build stage** — Node 22 Alpine runs `npm run build`, receiving `VITE_*` values as build args
2. **Runtime stage** — Nginx 1.27 Alpine serves the compiled `dist/` directory

Nginx handles:
- HTTPS termination (port 443) with SSL certificates
- HTTP → HTTPS redirect (port 80)
- Proxy of `/api/*` requests to the backend container
- SPA routing (`try_files` fallback to `index.html`)
- 30-day cache headers for static assets

See the root [README](../README.md) for full Docker deployment instructions.
