# Operations

## Sheet Sync

Manual sync:

```bash
npm run sync:sheets
```

Cron endpoint:

```text
/api/cron/sync-sheets
Authorization: Bearer $CRON_SECRET
```

Sync creates snapshots and change events, then dispatches pending notifications.

## Health

- Public liveness probe: `/healthz`
- Authenticated diagnostics probe: `/api/health`

## Deployment

- Run `npm run check` before deploy.
- Run Prisma migrations or `db:push` only through controlled release workflows.
- Configure all production env vars.
- Regenerate production VAPID keys.

## Backup and Restore

Back up PostgreSQL daily for production tenants. Test restore before enterprise onboarding.

## Failure Modes

- Google Sheets rate limit: retry later; sync is idempotent.
- Push delivery failure: stale subscriptions are cleaned up.
- Calendar token leak: user rotates or revokes token.

## Logging and Traceability

- All API/proxy responses include `x-request-id`.
- Structured logs are emitted via `src/server/observability/logger.ts`.
- Standard log fields:
  - `requestId`
  - `route`
  - `method`
  - `actorId` (when available)
  - `status`
  - `durationMs`
  - `errorCode`

## Incident Triage Flow

1. Identify the failing request from client/network logs.
2. Search logs by `requestId`.
3. Filter by `errorCode` and HTTP status family.
4. Verify whether the issue is auth/authz (`401/403`) vs validation (`400`) vs operational (`5xx`).
5. Correlate with audit events for sensitive mutations.
