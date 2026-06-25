# Produktive Buddy

Produktive Buddy is a campus schedule and attendance PWA for IIM Kozhikode students. It ingests official Google Sheets, personalizes timetables by batch, term, section, and courses, and supports attendance planning, lecture notes, friends/groups, push notifications, and calendar export.

## Quickstart

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run sync:sheets
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`.

## Core Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
npm run check
npm run security:audit
```

## Architecture

- Next.js App Router for pages and API routes.
- Prisma 7 with PostgreSQL and `@prisma/adapter-pg`.
- Domain logic is migrating to `src/modules/**` with thin handlers in `src/app/**`.
- Legacy feature services under `src/features/**` remain during migration.
- `src/server/**` holds auth, security, and audit concerns.
- `src/components/**` holds reusable UI.
- Official sheet ingestion lives under `src/lib/sheets`.

## Documentation

- `docs/setup.md` - local setup and common failures.
- `docs/architecture.md` - major flows and boundaries.
- `docs/security.md` - auth, CSRF, uploads, tokens, audit logging.
- `docs/privacy.md` - student data inventory and governance.
- `docs/operations.md` - sync, cron, deploy, backup, monitoring.
- `docs/testing.md` - test pyramid and commands.
- `docs/module-boundaries.md` - layering contract and import directions.
- `docs/api-surface.md` - endpoint inventory with auth/CSRF expectations.
- `docs/testing-matrix.md` - risk-to-test coverage map.
- `docs/agent-guide.md` - instructions for AI agents and new contributors.

## Enterprise Notes

Produktive Buddy is student-first today, but the schema and route guards include foundations for faculty and academic-admin roles. Official attendance is intentionally separated from student self-tracking.
