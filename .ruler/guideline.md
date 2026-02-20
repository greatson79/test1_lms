# AI Coding Agent Guidelines

Lessons learned from type, lint, and compile errors encountered during implementation.

## TypeScript

- Cast Supabase query results through `unknown` first when the Database type is `Record<string, never>` (e.g., `data as unknown as MyRow[]`).
- Never access `.error` directly on a `HandlerResult` union — narrow with `result.ok` check first, then cast to `ErrorResult<TCode>`.
- Follow the existing error-logging pattern: `(result as ErrorResult<TServiceError>).error.message` inside `if (!result.ok)` blocks.

## Next.js Routing

- Before creating any new page, scan `src/app/(protected)/` for an existing stub at the same URL path — route groups share the same URL namespace.
- Place all authenticated pages under `src/app/(protected)/` to inherit the layout-level auth guard.
- Delete or replace stub pages when providing a full implementation; never leave two files resolving to the same route.

## Supabase Query Types

- Supabase JS returns joined relations as arrays when `Database` types are absent — always define explicit row types and cast via `unknown`.
- Use `as unknown as T` for Supabase results; never use direct `as T` casts when the inferred shape differs structurally.

## Lint

- Never call a React Hook (`useCallback`, `useState`, etc.) conditionally or inside early-return branches.
- Keep all hook calls at the top level of the component, unconditionally.

## File Organization

- Verify the target directory with `find src/app -type f -name "page.tsx"` before scaffolding new pages.
- Register every new Hono feature router in `src/backend/hono/app.ts` immediately after creating the route file.
