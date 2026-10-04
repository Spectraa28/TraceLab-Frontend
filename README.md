# TraceLab Frontend

The Next.js frontend for TraceLab: a landing page, Python SDK documentation, and a workspace for inspecting traces, evaluation results, run comparisons, and project credentials.

## Run locally

Requires Node.js 22 and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `TRACELAB_BACKEND_URL` to your backend origin in `.env.local`. Open http://127.0.0.1:5173. The demo workspace uses bundled fixtures; live data and sign-in require a configured TraceLab backend.

## Deploy on Vercel

Import this repository, select the Next.js framework, and keep the Root Directory at the repository root. Use Node.js 22.x and the default install, build, and output settings.

Set `TRACELAB_BACKEND_URL` as a server-side Production environment variable to your HTTPS backend origin before building. Use an origin without credentials, paths, queries, or fragments. Redeploy after changing it. Browser API requests and OAuth callbacks go through the frontend's same-origin proxy.

Configure the backend's `TRACELAB_FRONTEND_URL` with your stable frontend production origin. Register OAuth callbacks at `/api/v1/auth/google/callback` and `/api/v1/auth/github/callback` on that frontend origin. Database credentials and OAuth client secrets belong on the backend.

The main routes are `/` (landing), `/docs` (SDK setup), and `/app` (workspace). Backend, SDK, and agent source are maintained separately.
