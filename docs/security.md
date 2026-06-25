# Security

## Authentication

Primary sign-in is Google Workspace OAuth for `@iimk.ac.in`, with OTP fallback.
Email prefixes map users to batches. Sessions are HTTP-only cookies backed by
signed JWTs.

## Mutation Protection

Cookie-authenticated mutation routes call `assertSameOrigin(request)` before
parsing or writing data. This blocks cross-origin form/script attempts.

## Rate Limiting

OTP send/verify routes use `src/server/security/rate-limit.ts`:

- Redis-backed counters when `REDIS_URL` is configured.
- Local in-memory fallback in development/failure modes.
- Normalized client IP extraction from trusted proxy headers.

## Uploads

PDF uploads are restricted to PDF MIME type and 5 MB. Keep PDF parsing off untrusted large files.

## Calendar Tokens

Calendar feeds are bearer URLs. Controls include:

- Token rotation/revocation for personal feed.
- Scoped share links (day/week/all/custom).
- Share revocation by token.
- Share expiry enforcement.

Treat all calendar URLs as private secrets.

## Service Worker

The service worker must not cache personalized navigations or `/api/*` responses. Only static assets and the offline shell are cacheable.

## Audit Logging

Sensitive mutations write best-effort `AuditLog` records. Auth lifecycle events
(OTP/Google/logout) and calendar-share actions are audited. Audit failures are
logged but do not break user flows.

## Structured Logging

- Request ID header: `x-request-id`.
- Structured logs emitted by `src/server/observability/logger.ts`.
- Standard fields: `requestId`, `route`, `method`, `actorId`, `status`,
  `durationMs`, `errorCode`.

## Production Checklist

- Use strong `AUTH_SECRET` and VAPID keys.
- Configure `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Configure `REDIS_URL` for shared production rate limiting.
- Enable HTTPS and HSTS.
- Keep dependency audit exceptions documented.
- Do not expose OTP codes outside local development.
- Review all new mutation APIs for ownership checks.
