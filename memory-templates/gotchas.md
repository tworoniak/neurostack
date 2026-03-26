# Gotchas

> Known bugs, quirks, and workarounds. Check here before spending time debugging.
> Add a gotcha the moment you discover it — don't wait until session end.

## Format
<!--
## Short description of the problem
- **Affects**: which project/file/dependency
- **Symptom**: what you see when it goes wrong
- **Fix**: exact steps or command to resolve it
- **Date found**: YYYY-MM-DD
-->

## Examples to seed from your own experience

## Supabase auth session not persisting on refresh
- **Affects**: any Supabase project using @supabase/auth-helpers-react
- **Symptom**: user appears logged out after page refresh despite valid session
- **Fix**: ensure `<SessionContextProvider>` wraps the app at root level, not inside a layout
- **Date found**: 2026-01-10

## Prisma JSON field double-encoding
- **Affects**: Prisma + PostgreSQL projects using jsonb columns
- **Symptom**: stored value is a JSON string instead of a JSON object
- **Fix**: pass the object directly to the update — do not JSON.stringify before passing to Prisma
- **Date found**: 2026-02-03
