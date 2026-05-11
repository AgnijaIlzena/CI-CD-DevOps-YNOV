# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrainShop is a pedagogical CI/CD project (YNOV DevOps course). The goal is to build GitHub Actions workflows on top of a pre-existing app. The app itself is intentionally simple.

## Architecture

```
Browser → Frontend (port 8081, nginx) → API (port 3000, Express) → PostgreSQL (port 5432)
```

- **`frontend/`** — Static HTML/CSS/JS served by nginx via Docker
- **`api/`** — Node.js/Express REST API; entry point is `src/server.js`, app logic in `src/app.js`, DB pool in `src/db.js`
- **`database/init/`** — SQL init scripts auto-executed by PostgreSQL on first start
- **`.github/workflows/`** — GitHub Actions CI/CD workflows

The API connects to PostgreSQL via `DATABASE_URL` env var. Tests mock `src/db.js` entirely (no real DB needed for tests).

## Commands

### Run the full stack

```powershell
Copy-Item .env.example .env   # first time only
docker compose up -d --build
```

### Stop

```bash
docker compose down        # keep data
docker compose down -v     # also delete DB volume
```

### API tests (no Docker needed)

```bash
cd api
npm install
npm test
```

### Run a single test file

```bash
cd api
npx jest tests/health.test.js
```

## API Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | DB connectivity check |
| GET | `/products` | List all products |
| GET | `/products/:id` | Get one product |
| POST | `/products` | Create product (`name`, `description`, `price_cents` required) |
| GET | `/about` | Static project info JSON |

## CI/CD Context

The existing workflow (`.github/workflows/ci.yml`) only prints a message on push to `main`. The TP exercises build it up progressively:
1. Run API tests in CI
2. Verify Docker builds
3. (Bonus) Publish Docker images

When writing workflows, API tests run with `--runInBand` (jest flag already set in `package.json`) and require no external services because `src/db.js` is mocked.
