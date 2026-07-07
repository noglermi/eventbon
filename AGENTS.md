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
