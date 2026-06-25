# Privacy

## Data Classification

Refer to `docs/data-classification.md` for the full policy. In summary:

- Local-only: attendance planning marks, lecture note drafts/content, course color
  preferences, UI personalization state.
- Sync-required: active term/section and enrollment choices when cross-device
  continuity is required.
- Server-required: institutional timetable graph, auth/session controls,
  collaboration state, push/calendar delivery primitives.
- Analytics-derived: minimized operational/security telemetry.

## Student Data Stored Server-Side

- Account identity: email, optional name/roll number, batch mapping.
- Shared schedule graph and source sync lineage.
- Collaboration entities (friends/groups), push subscriptions, calendar tokens/shares.
- Audit logs for sensitive actions.

## Data Principles

- Collect only what is needed for schedule personalization.
- Keep student self-attendance separate from future official attendance.
- Keep personal planning state local-first whenever possible.
- Calendar feed tokens and share links are revocable and expiry-aware.
- Personal notes are private to the student.
- Avoid write-on-read side effects for personal data.

## B2B Readiness

Before enterprise deployment, add:

- data export and deletion flows
- tenant-specific retention policy
- admin audit review UI
- documented subprocessors and hosting region
- incident response and breach notification procedures
