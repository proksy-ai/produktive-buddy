# Testing Matrix

This matrix maps high-risk behavior to minimum test coverage expectations.

## Authentication and Session

- OTP send/verify validation and rate-limit behavior.
- Google OAuth callback validation (`email_verified`, domain, batch mapping).
- Session cookie issuance and logout semantics.

## Authorization and Ownership

- Active-term ownership checks for attendance and notes.
- Batch scoping for onboarding term/course queries.
- Group membership checks for group mutations.
- Admin-only access to roster APIs.

## Security Controls

- Same-origin enforcement on cookie-authenticated mutations.
- Calendar token/share revocation and expiry behavior.
- Proxy/middleware request gating and redirect behavior.
- Upload validation (PDF type and size constraints).

## Domain and Personalization

- Attendance policy and risk calculations.
- Course clash detection and section selection rules.
- Sheet parsing and session sync reconciliation.
- ICS generation correctness and escaping.
- Free/busy overlap computation.

## Local-First Behavior

- Local persistence fallback for attendance and notes.
- Pending local mutations survive offline/network failure.
- Flush/replay of pending client mutations.

## Operational and Diagnostics

- Public `/healthz` liveness.
- Authenticated `/api/health` diagnostics.
- Structured log helpers and request-id propagation utilities.

## Required CI Gates

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:integration`
- `npm run build`
