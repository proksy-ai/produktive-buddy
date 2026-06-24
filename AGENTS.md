<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Kairo Engineering Rules

- Read `README.md` and `docs/agent-guide.md` before substantial edits.
- Keep API routes thin; put business logic in `src/features/**`.
- Keep cross-cutting server concerns in `src/server/**`.
- Do not import Prisma into middleware or edge runtime code.
- Cookie-authenticated mutation routes must validate same-origin requests.
- Add or update tests for changed business rules.
- Run `npm run check` before handing off broad changes.
