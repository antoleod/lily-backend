# Lily Backend

[![CI](https://github.com/lily-protocol/lily-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/lily-protocol/lily-backend/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

Backend service for Lily Protocol, the autonomous agent finance infrastructure for AI agents on Stellar.

This repository is the backend foundation for provisioning agent-facing services, exposing developer APIs, validating requests, and supporting modular protocol features such as wallets, payments, agent identity, and orchestration flows.

## Highlights

- Express backend with strict TypeScript
- Modular feature structure for contributor-friendly development
- Zod-powered environment and request validation
- Security middleware with Helmet, CORS allowlist, and rate limiting
- Structured logging with Pino
- Automated lint, build, and test checks in GitHub Actions
- Docker-ready local and deployment workflow

## Docker

The production Docker image runs as the `node` user (non-root) for security. The `Dockerfile` uses the `--chown=node:node` flag on `COPY` instructions so the `node` user owns all application files. No additional configuration is needed.

## Tech Stack

- Node.js 22
- Express 5
- TypeScript
- Zod
- Vitest and Supertest
- Docker
- GitHub Actions

## Quick Start

```bash
npm install
npm run dev
```

The repo already includes a local `.env` for development. If you want to recreate it manually:

```bash
cp .env.example .env
```

The server runs on `http://localhost:4000` by default.

## Available Endpoints

The default API prefix is `/api/v1` and can be changed with `API_PREFIX`.

| Method | Path | Success | Purpose / notable errors |
| --- | --- | --- | --- |
| `GET` | `/` | `200` | Service metadata and health-docs pointer. |
| `GET` | `/api/v1/health` | `200` | Service health and build metadata. |
| `GET` | `/api/v1/health/live` | `200` | Liveness probe. |
| `GET` | `/api/v1/health/ready` | `200` | Readiness probe. |
| `GET` | `/api/v1/metrics` | `200` | Process metrics. |
| `GET` | `/api/v1/agents` | `200` | List agents. |
| `GET` | `/api/v1/agents/:id` | `200` | Fetch one agent; `404` when the id is unknown. |
| `POST` | `/api/v1/agents` | `201` | Create an agent; `400` for invalid input. |
| `PATCH` | `/api/v1/agents/:id` | `200` | Update agent status; `400`/`404` for invalid input or unknown id. |
| `DELETE` | `/api/v1/agents/:id` | `204` | Delete an agent; `404` when the id is unknown. |
| `POST` | `/api/v1/payments` | `201` | Create a quote; `400` for invalid input. |
| `GET` | `/api/v1/payments/quotes/:id` | `200` | Retrieve a live quote; `404` if missing and `410` if expired. |
| `POST` | `/api/v1/payments/execute` | `200` | Execute a confirmed quote; `400`, `404`, `409`, or `410` for invalid, missing, already-executed, or expired quotes. |

When `AUTH_API_KEY` is configured, agent routes additionally require the configured API-key header and may return `401`/`403` for missing or incorrect credentials. API routes may also return `429` when the shared rate limit is exceeded.

All `/api/v1` responses send `Cache-Control: no-store` so dynamic agent and
payment data is not cached by clients or shared proxies. The root route is a
basic service metadata response and is kept outside this API cache policy.

### Response Envelope

API handlers return successful JSON responses in this shape:

```json
{
  "success": true,
  "data": {}
}
```

The root metadata route uses `success: true` with `message` and `docs`, while successful `DELETE /api/v1/agents/:id` returns `204` with no body.

Errors use the shared error envelope:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "OPTIONAL_MACHINE_READABLE_CODE",
  "details": {}
}
```

`code` and `details` are optional and appear only when the error supplies them. Validation failures can use `details` for per-field errors; unknown production `500` errors are redacted to a generic message.

## Example API

Create a payment quote with the route currently mounted by `payments.routes.ts`:

```bash
curl -X POST http://localhost:4000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAsset": "USDC",
    "destinationAsset": "XLM",
    "sourceAmount": "100.00"
  }'
```

The sample `agents` module shows contributors how to structure backend features:

- route registration
- request validation with Zod
- typed controllers and responses
- service-layer business logic
- module-local TypeScript types

`POST /api/v1/agents` accepts only `name`, `description`, and `capabilities`.
Unknown payload keys are rejected with validation field errors.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run audit:prod
npm run format
npm run test
npm run test:coverage
```

## Project Structure

```text
src/
  common/
  config/
  modules/
    agents/
    health/
    payments/
  routes/
  app.ts
  server.ts
tests/
```

## Docker

```bash
docker build -t lily-backend .
docker run --env-file .env -p 4000:4000 lily-backend
```

## Quality Standards

Every contribution is expected to pass:

```bash
npm run lint
npm run typecheck
npm run audit:prod
npm run build
npm run test:coverage
```


## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines and local setup details.

## API Versioning Strategy

This backend uses **URL path versioning** as its primary API versioning mechanism.

- All endpoints are mounted under `/api/v1/` (configurable via `API_PREFIX` env var)
- When breaking changes are required, a new version module (`v2`) will be created and mounted alongside `v1`
- The existing `v1` routes will continue to serve existing clients without modification
- New major versions are introduced only for breaking changes; additive changes land in the current version
- Deprecation of old versions follows a minimum 6-month notice period documented in release notes

### Adding a New API Version

1. Create `src/routes/v2/index.ts` with the new router
2. Mount it in `src/app.ts`: `app.use("/api/v2", apiV2Router)`
3. Keep `v1` routes unchanged for backward compatibility
4. Document migration guide in `docs/migration/v1-to-v2.md`
5. Announce deprecation timeline in CHANGELOG
