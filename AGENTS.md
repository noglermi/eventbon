<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Database/API Contract Synchronization

Whenever a database table, SQL migration, PostgreSQL RPC function, repository method, or frontend payload changes, verify the database and frontend contract in the same change.

- If an RPC parameter is added, removed, renamed, or reordered, update the SQL migration and the repository call together.
- If a table column is added and used by the frontend, verify inserts, reads, dashboards, exports, and RPC functions support it.
- Every RPC-related change must include a manual check that frontend payload keys exactly match SQL function parameters.
- Run the relevant Supabase migration before testing the corresponding frontend change.
- Do not allow silent fallback for RPC signature mismatches.

### Database Contract Checklist

- Frontend payload keys == SQL function parameters.
- SQL migration includes the current RPC signature and grants.
- Repository call uses the same names and compatible value types.
- New columns are covered by inserts, reads, dashboards, exports, and RPCs where applicable.
- The migration has been executed before frontend validation.

## Release Strategy And Beta-First Development

The project intentionally prioritizes a complete, testable event workflow before full production security hardening.

Until RC-4, avoid major architecture refactoring unless it is required for a beta blocker.

Allowed before RC-4:

- bug fixes
- UX improvements
- printing
- beta workflow improvements

Avoid before RC-4:

- large security rewrites
- large database redesigns
- unnecessary RPC redesigns

Security remains mandatory before production release. Full Row Level Security, RPC security review, storage policies, server-side validation, token review, permission review, security testing, DSGVO review, and production hardening are scheduled for RC-4 after successful field beta and pilot operation.
