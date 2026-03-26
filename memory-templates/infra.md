# Infrastructure

> Servers, ports, environment variables, services, and credentials references.
> Never store actual secrets here — reference where they live (e.g. 1Password, .env.local).

## Local dev ports
| Project | Port | Notes |
|---|---|---|
| NeuroStack | 5173 | Vite default |
| usePopcorn v2 | 5174 | |
| Component Library | 5175 | |
| NestJS API | 3000 | |

## Supabase projects
| Project | Ref ID | Notes |
|---|---|---|
| (add yours) | | |

## Environment variable locations
- `.env.local` — never committed, in each project root
- 1Password vault: "Dev secrets" — all API keys and service credentials

## Services in use
- Vercel — frontend deployments
- Supabase — auth + database
- Cloudinary — media (photography + Antihero Magazine)
- Azure — Functions for serverless workloads
