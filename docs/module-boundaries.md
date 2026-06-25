# Module Boundaries

This file defines where new code should go and what import directions are
allowed.

## Architectural Rule

```text
UI -> Application -> Domain -> Infrastructure -> Data
```

No layer should import "up" the stack.

## Placement Guide

- `src/app/**`
  - Route handlers and page composition only.
  - Allowed: request parsing, auth/session checks, response mapping.
  - Not allowed: domain logic branching, direct infrastructure orchestration.
- `src/components/**`
  - Reusable UI components and client hooks.
  - Not allowed: importing DB or server infrastructure.
- `src/modules/<name>/application/**`
  - Use-case orchestration.
  - Allowed to call domain policies and infrastructure adapters.
- `src/modules/<name>/domain/**`
  - Pure business rules and data transformations.
  - No framework/runtime side effects.
- `src/modules/<name>/infrastructure/**`
  - Prisma, external APIs, queue/email/push adapters.
- `src/server/**`
  - Cross-cutting security, audit, observability, and request context helpers.
- `src/lib/**`
  - Shared utilities and compatibility helpers while migration is in progress.

## Current Transitional Reality

The codebase is migrating from `src/lib` + `src/features` into `src/modules`.
While migrating:

- Prefer creating new logic in `src/modules/**`.
- Keep existing behavior stable.
- Extract logic from route handlers before introducing new features.

## Dependency Direction Constraints

- `src/features/**` must not import from `src/app/**` or `src/components/**`.
- `src/server/**` must not import from `src/app/**` or `src/components/**`.
- `src/components/**` must not import from `src/app/**`, `src/server/**`, or `src/lib/db`.
- `src/lib/**` should not import from route/UI layers.

These are partially lint-enforced in `eslint.config.mjs`.

## Definition of Done for Refactors

- Route handlers are thin wrappers around application services.
- Business rules are unit-tested at domain/service level.
- Shared helpers are side-effect-free by default.
- Documentation is updated in `docs/architecture.md` and `docs/api-surface.md`.
