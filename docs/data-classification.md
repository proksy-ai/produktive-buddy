# Data Classification Policy (Local-First)

Produktive Buddy follows a strict local-first policy for personal planning data.

## 1) Local-Only

Default storage location: device (IndexedDB / browser local storage)

- Attendance marks used for personal bunk planning.
- Session note drafts and note content.
- Course color preferences and UI personalization state.
- Local onboarding draft state and transient UI preferences.

## 2) Sync-Required (Optional Cross-Device Continuity)

Stored server-side only when required for continuity/collaboration:

- Active term/section and elective selection metadata.
- Notification preference toggles.
- Calendar provider preference.

## 3) Server-Required

Must exist server-side for product value, security, or collaboration:

- Institutional timetable graph and sync lineage.
- Authentication/session state and email domain/batch mapping.
- Collaboration entities (friends/groups) and invite/admin roster workflows.
- Push subscription endpoints and calendar share tokens.

## 4) Analytics-Derived (Minimized)

Collect only what is operationally necessary:

- Audit records for sensitive actions.
- Aggregate feature usage and operational counters.
- Request logs with request IDs and bounded metadata.

## Guardrails

- No write-on-read side effects for user data.
- Do not store secrets, OTPs, raw bearer tokens, or excessive PII in logs.
- Prefer explicit user actions for creating shareable identifiers/tokens.
- Any new server-persisted user field must include a policy-class justification.
