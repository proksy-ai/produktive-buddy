# Setup

## Requirements

- Node.js 20+
- npm
- PostgreSQL 17 or compatible

## Environment

Copy `.env.example` to `.env` and fill the required values:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `CRON_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_SUBJECT`

Never commit real `.env` files.

## Local Bootstrap

```bash
npm install
npm run db:push
npm run db:seed
npm run sync:sheets
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Prisma 7 Notes

Database URLs are loaded through `prisma.config.ts`, not `schema.prisma`. Runtime access uses `@prisma/adapter-pg`.

## Common Failures

- `node:util/types` in dev usually means an edge route imported Prisma transitively.
- OTP login in development returns `devCode`; production must not expose OTP codes.
- Calendar push requires VAPID keys and localhost or HTTPS.
