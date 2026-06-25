# Testing

## Test Pyramid

- Unit tests: pure business rules and parsers.
- Integration tests: service/database ownership checks.
- E2E smoke tests: login redirect and high-level UI availability.

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
npm run check
```

## What Must Be Tested

- attendance policy and thresholds
- course color assignment
- sheet parsing
- calendar ICS escaping/timezones
- friends/groups free-busy calculations
- ownership checks for session, course, group, note, and calendar mutations

Detailed coverage expectations are tracked in `docs/testing-matrix.md`.

## CI Rule

No PR should merge unless lint, typecheck, unit tests, integration tests, and build pass.
