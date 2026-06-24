# Security

## Authentication

Students sign in with OTP to `@iimk.ac.in` email addresses. Email prefixes map users to batches. Sessions are HTTP-only cookies backed by signed JWTs.

## Mutation Protection

Cookie-authenticated mutation routes should call `assertSameOrigin(request)` before parsing or writing data. This blocks cross-origin form/script attempts.

## Rate Limiting

OTP send/verify routes use in-memory rate limits for local/MVP deployments. For multi-instance production, replace `src/server/security/rate-limit.ts` with Redis or another shared store.

## Uploads

PDF uploads are restricted to PDF MIME type and 5 MB. Keep PDF parsing off untrusted large files.

## Calendar Tokens

Calendar feeds are bearer URLs. Users can rotate or revoke them. Treat these tokens as private secrets.

## Service Worker

The service worker must not cache personalized navigations or `/api/*` responses. Only static assets and the offline shell are cacheable.

## Audit Logging

Sensitive mutations write best-effort `AuditLog` records. Audit failures are logged but do not break user flows.

## Production Checklist

- Use strong `AUTH_SECRET` and VAPID keys.
- Enable HTTPS and HSTS.
- Keep dependency audit exceptions documented.
- Do not expose OTP codes outside local development.
- Review all new mutation APIs for ownership checks.
