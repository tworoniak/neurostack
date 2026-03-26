# Stack & Conventions

> My default choices and patterns. Agents: use these unless a project file says otherwise.

## Frontend
- React 18/19 + TypeScript (strict mode always)
- Vite for bundling, Vitest for unit tests
- Tailwind CSS or SCSS modules (modular architecture: abstracts → base → layout → components → theme)
- React Query for async state, Zod for runtime validation
- react-router-dom v6 for routing

## Backend / services
- Supabase for auth and database (PostgreSQL)
- Prisma ORM for type-safe DB access
- NestJS for structured API layers
- Azure Functions for serverless/event-driven work
- Cloudinary for media (photography portfolio, Antihero Magazine)

## Code conventions
- Named exports only — no default exports except page components
- `const` arrow functions for all components and hooks
- `unknown` over `any`, always
- Custom hooks for all async logic — never fetch in components directly
- Barrel exports (`index.ts`) per feature folder
- No magic strings — use enums or `as const` objects

## SCSS architecture
```
styles/
  abstracts/   _variables, _mixins, _functions
  base/        _reset, _typography
  layout/      _grid, _containers
  components/  _buttons, _cards, etc.
  theme/       _dark, _light
```

## Git conventions
- Branch: `feature/`, `fix/`, `chore/`, `refactor/`
- Commits: conventional commits format (feat:, fix:, chore:, docs:)
- PRs: squash merge, descriptive title
