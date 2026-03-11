# Hello Ivy — Web

A Next.js 16 web application for the Hello Ivy platform. Built with React 19, TypeScript, Tailwind CSS v4, and Auth.js.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Authentication](#authentication)
- [AI Features](#ai-features)
- [Building & Linting](#building--linting)
- [Docker](#docker)
- [Project Structure](#project-structure)

---

## Tech Stack

| Layer        | Technology                            |
|--------------|---------------------------------------|
| Framework    | Next.js 16.1.1 (App Router)           |
| UI Library   | React 19.2.3                          |
| Language     | TypeScript 5 (strict mode)            |
| Styling      | Tailwind CSS v4                       |
| Auth         | Auth.js (next-auth 5.0.0-beta.30)     |
| AI / Voice   | OpenAI API (realtime + transcription) |
| Package Mgr  | pnpm                                  |

---

## Prerequisites

- **Node.js** >= 24 (matches the Docker base image `node:24-alpine`)
- **pnpm** >= 9 — install via `npm install -g pnpm` or `corepack enable pnpm`
- **Backend API** running at `http://localhost:8000` (Django). The frontend authenticates and fetches data through this backend.

---

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd helloivy-web-main
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the values as described in the [Environment Variables](#environment-variables) section below.

4. **Start the development server**

   ```bash
   pnpm dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

### Required

| Variable                  | Example                        | Description                                                                                  |
|---------------------------|--------------------------------|----------------------------------------------------------------------------------------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000`       | Base URL of the backend Django API. Used by auth, data fetching, and all API calls.          |
| `AUTH_SECRET`             | *(see below)*                  | Secret key for Auth.js session signing. Generate with `openssl rand -base64 32`.             |
| `AUTH_URL`                | `http://localhost:3000`        | Canonical URL of the app, used by Auth.js for callbacks and redirects.                      |

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### AI / Voice Features

| Variable                       | Example              | Description                                                                                           |
|--------------------------------|----------------------|-------------------------------------------------------------------------------------------------------|
| `OPENAI_API_KEY`               | `sk-...`             | **Server-only.** Used by the `/api/realtime/session` and `/api/transcribe` routes.                   |
| `NEXT_PUBLIC_OPENAI_API_KEY`   | `sk-...`             | **Client-exposed.** Used by TTS hooks and several conversation pages. Keep consistent with the above. |

> **Security note:** `NEXT_PUBLIC_OPENAI_API_KEY` is embedded in the browser bundle. Prefer routing all OpenAI calls through server-side API routes when possible using `OPENAI_API_KEY` instead.

### Optional

| Variable                    | Example                 | Description                                                                     |
|-----------------------------|-------------------------|---------------------------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`       | `http://localhost:8000` | Alternate API base used by the RAG conversation module. Defaults to port 8000.  |
| `NEXT_PUBLIC_DEEPGRAM_API_KEY` | `dg-...`             | Deepgram API key for speech-to-text. Not currently wired up in code.            |

---

## Development

```bash
# Start dev server with hot reload
pnpm dev

# Type-check without emitting
pnpm tsc --noEmit

# Lint
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format with Prettier
pnpm format

# Check formatting
pnpm format:check
```

---

## Authentication

Authentication is handled by **Auth.js (next-auth v5 beta)** using a **Credentials provider** that delegates to the backend:

- **Login**: `POST ${NEXT_PUBLIC_API_BASE_URL}/api/accounts/login/`
- **Session hydration**: `GET ${NEXT_PUBLIC_API_BASE_URL}/api/accounts/me/`

Public routes that skip authentication:

- `/` (landing page)
- `/login`
- `/signup`
- `/essay-evaluator`

All other routes require a valid session and redirect to `/login` if unauthenticated.

---

## AI Features

Several features rely on OpenAI:

| Feature                        | Variable(s) needed                                    |
|--------------------------------|-------------------------------------------------------|
| Realtime voice conversation    | `OPENAI_API_KEY`                                      |
| Speech-to-text transcription   | `OPENAI_API_KEY` (server), `NEXT_PUBLIC_OPENAI_API_KEY` (fallback) |
| Text-to-speech (TTS) playback  | `NEXT_PUBLIC_OPENAI_API_KEY`                          |
| Essay brainstorm / college AI  | `NEXT_PUBLIC_OPENAI_API_KEY`                          |

These features will silently degrade or show errors if the keys are not set.

---

## Building & Linting

```bash
# Production build
pnpm build

# Start production server (after build)
pnpm start
```

The `predeploy` script runs lint and build together:

```bash
pnpm predeploy
```

---

## Docker

A multi-stage `Dockerfile` is included for containerised deployments.

```bash
# Build the image
docker build -t helloivy-web .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://your-api-host \
  -e AUTH_SECRET=your-secret \
  -e AUTH_URL=http://localhost:3000 \
  -e OPENAI_API_KEY=sk-... \
  helloivy-web
```

The container listens on port `3000` with `NODE_ENV=production`.

---

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── _components/        # Shared UI components
│   ├── _constants/         # Static data (nav items, country codes, etc.)
│   ├── _contexts/          # React context providers
│   ├── _hooks/             # Custom React hooks
│   ├── _providers/         # App-level providers
│   ├── (landingpage)/      # Landing page route group
│   ├── (saas)/             # Authenticated app route group
│   │   ├── career-discovery/
│   │   ├── college/
│   │   ├── dashboard/
│   │   ├── essay-brainstorm/
│   │   ├── essay-evaluator/
│   │   ├── interview-prep/
│   │   ├── resume/
│   │   └── ...
│   ├── api/                # Next.js API routes (server-side)
│   │   ├── auth/
│   │   ├── realtime/
│   │   └── transcribe/
│   └── signup/
├── assets/                 # Static assets (images, Lottie animations)
├── components/             # Additional shared components
├── lib/                    # API clients, utilities, hooks
├── pages/api/              # Legacy pages-router API routes
├── public/                 # Public static files
├── types/                  # Global TypeScript type declarations
├── auth.config.ts          # Auth.js route config
├── auth.ts                 # Auth.js provider and session logic
├── next.config.ts          # Next.js configuration
└── Dockerfile
```
