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

Use `/api/health` for database and sync freshness checks.

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
