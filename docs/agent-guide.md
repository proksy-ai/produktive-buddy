# Agent Guide

## Before Editing

- Read `AGENTS.md`.
- This is Next.js 16; read relevant docs in `node_modules/next/dist/docs/` before changing framework behavior.
- Prefer feature services under `src/features/**` for business logic.
- Keep API routes thin.
- Do not import Prisma into middleware or edge runtime code.

## Safe Commands

```bash
npm run typecheck
npm run test
npm run build
npm run check
```

## Security Expectations

- Mutation APIs using cookies must call `assertSameOrigin`.
- Validate ownership before writing user-linked resources.
- Never log secrets or OTPs outside explicit local dev.
- PDF uploads must pass `assertPdfFile`.
- Calendar tokens are bearer secrets.

## Documentation Expectations

If you add a new subsystem, update docs in `docs/` and add tests for the core rules.
