# API Surface

This document tracks major route families, ownership requirements, and security
expectations.

## Security Baseline

- Cookie-authenticated mutation routes must call `assertSameOrigin(request)`.
- Every mutating route must validate request shape (typically `zod`).
- Every user-linked write must enforce ownership or role authorization.
- Sensitive writes should emit `auditLog`.

## Auth and Session

- `POST /api/auth/otp/send`
  - Public.
  - Sends OTP after institute-email and batch-prefix validation.
  - Rate limited by IP/email key.
- `POST /api/auth/otp/verify`
  - Public endpoint that sets session cookie.
  - Must enforce same-origin checks to avoid login CSRF.
- `GET /api/auth/google`
  - Public OAuth start endpoint.
- `GET /api/auth/google/callback`
  - Public OAuth callback.
  - Enforces verified `@iimk.ac.in` email and batch-prefix mapping.
- `POST /api/auth/logout`
  - Authenticated session clear endpoint.

## Onboarding and Personalization

- `GET /api/onboarding/courses`
  - Authenticated.
  - Must scope requested term to the user's batch.
- `POST /api/onboarding/complete`
  - Authenticated + same-origin.
  - Writes user profile, active term, section/enrollment selections.
- `POST /api/courses/enrollments`
  - Authenticated + same-origin.
  - Replaces active-term enrollments.
- `POST /api/onboarding/parse-pdf`
  - Authenticated + same-origin.
  - Validates upload constraints before parsing.

## Personal Planning

- `POST /api/attendance`
  - Authenticated + same-origin.
  - Marks/clears attendance for sessions in the active term.
- `POST /api/notes`
  - Authenticated + same-origin.
  - Upserts/deletes private note per session.

## Collaboration and Social

- `POST /api/friends/add`
  - Authenticated + same-origin.
  - Adds accepted friendship by friend code.
- `POST /api/groups`
  - Authenticated + same-origin.
  - Creates group.
- `POST /api/groups/[groupId]/members`
  - Authenticated + same-origin.
  - Adds group member by friend code if actor is in group.

## Notifications and Calendar

- `POST /api/push/subscribe`
  - Authenticated + same-origin.
  - Stores browser push endpoint and keys.
- `POST /api/push/unsubscribe`
  - Authenticated + same-origin.
  - Removes push endpoint for current user.
- `POST /api/push/test`
  - Authenticated + same-origin.
  - Sends test notification to actor subscriptions.
- `GET /api/calendar/link`
  - Authenticated.
  - Returns own calendar token links and active share links.
- `POST /api/calendar/link`
  - Authenticated + same-origin.
  - Rotates personal token or creates scoped share link.
- `DELETE /api/calendar/link`
  - Authenticated + same-origin.
  - Revokes personal token and optionally a share token.
- `GET /api/calendar/[token].ics`
  - Token-based read endpoint.
  - Must enforce token revocation/expiry behavior.

## Admin Surface

- `/api/admin/roster/import`
- `/api/admin/roster/invite`
- `/api/admin/roster/stats`

All require admin role + same-origin for mutations.

## Operational Surface

- `POST /api/cron/sync-sheets`
  - Bearer-protected (`CRON_SECRET`), no session.
- `GET /healthz`
  - Public liveness endpoint.
- `GET /api/health`
  - Authenticated diagnostic endpoint.
