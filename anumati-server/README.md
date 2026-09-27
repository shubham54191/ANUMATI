# anumati-server

The ANUMATI API and worker. Fastify 5 on Node 22, PostgreSQL 16, pg-boss for jobs.
It runs **the same engine the browser runs** — `anumati-web/lib` is imported through
the `@/*` path and bundled in by tsup — so a roadmap, a clock or a conflict is computed
identically on both sides. The server's copy is the one that counts.

## Run it

```bash
# 1. A database (or use docker compose from the repo root)
docker run -d --name anumati-pg -e POSTGRES_USER=anumati -e POSTGRES_PASSWORD=anumati \
  -e POSTGRES_DB=anumati -p 5432:5432 postgres:16-alpine

# 2. Configure
cp .env.example .env          # set JWT_SECRET (openssl rand -hex 32)

# 3. Two processes
npm ci
npm run dev                   # API on :4000 — migrates, publishes the seed rule set, seeds demo data
npm run dev:worker            # deliveries, registry checks, SLA sentinel, renewals, ledger anchor

# 4. The web app in live mode
cd ../anumati-web && NEXT_PUBLIC_ANUMATI_API=http://localhost:4000 npm run dev
```

The whole stack in one command: `docker compose up --build` from the repository root.

## Demo accounts (DEMO_MODE=true only)

| User | Password | Role | Lands on |
|---|---|---|---|
| `applicant` / `deccan` | `demo` | applicant | Roadmap → My applications |
| `officer` | `admin` | single-window facilitation | Clearance console (dispatch, revise, finalise) |
| `mpcb` `midc` `fire` `dish` `msedcl` `ceig` `labour` | `demo` | department officer | Console — acts on its own desks only |
| `committee` | `demo` | Empowered Committee | Committee desk |
| `reviewer` | `demo` | rule reviewer | Rule review |

## What is real and what is stood in

| Part | State |
|---|---|
| Accounts, roles, department boundaries | Real. scrypt passwords, HS256 tokens, every command checked server-side. |
| Roadmap, pre-validation, waves, clocks, conflicts | Real — the shared engine, re-run on the server; the browser's result is never trusted. |
| Decision ledger | Real. SHA-256 hash chain, advisory-locked appends, UPDATE/DELETE/TRUNCATE blocked by triggers, daily anchor, `npm run ledger:verify`. |
| Documents | Real. Content-addressed by SHA-256, type sniffed from bytes (PDF/PNG/JPEG only), size-capped. |
| Government systems (APISetu, MAITRI, department endpoints) | **Recorded answers** in `ADAPTER_MODE=fixture`. The live adapters exist with retries, a circuit breaker and idempotency keys, but need credentials and endpoints this build does not have. |
| Officer signatures | **Demo signer** in `DSC_MODE=demo` — an Ed25519 key derived from the server secret, labelled "not a DSC" everywhere. `DSC_MODE=external` verifies a signature made by the officer's own DSC against their X.509 certificate. Chain validation to the CCA root is the deployment's trust store. |
| MAITRI single sign-on | Wired to verify a MAITRI-issued JWT against `MAITRI_JWKS_URL`; untested against the real issuer. |

`NODE_ENV=production` refuses to start with `DEMO_MODE=true` or `DSC_MODE=demo`.

## Rules the code keeps

- **Two clocks per desk.** The service-limit clock (MAITRI Act s. 5: lapse → transfer to the
  Committee) and the parent Act's deeming clock where one exists. Both start when *that desk*
  receives the file, and both pause while that desk's own query waits on the applicant.
  In this pilot reading, a transfer does not stop the parent Act's deeming clock.
- **Waves.** Only approvals whose prerequisites are issued are filed; the rest are released by
  the engine as their inputs are granted. Submission is judged on the current wave only.
- **One write path.** Every change to a file is a command: load → check the actor → apply with
  the engine → optimistic version check → write snapshot, projections, ledger row and jobs in
  **one transaction**.

## Checks

```bash
npm run typecheck
npm test          # needs Postgres: TEST_DATABASE_URL (default …/anumati_test)
npm run build
npm run ledger:verify
```
