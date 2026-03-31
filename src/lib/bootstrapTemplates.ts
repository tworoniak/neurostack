/** Template content for new project memory directory bootstrap. */

export function getTemplates(projectName: string): { path: string; content: string }[] {
  return [
    {
      path: 'MEMORY.md',
      content: `# Memory Index

> Routing table — read this first, then load the relevant files below.
> This is your context layer. Don't skip it.

## Always read on session start
- \`active-work.md\` — what is running right now across all agents
- \`gotchas.md\` — check before debugging anything

## By task type

| Working on | Read |
|---|---|
| Any project | \`projects/<project-name>.md\` |
| Architecture / tech choices | \`decisions.md\` |
| Infrastructure, ports, env vars | \`infra.md\` |
| Session history | \`worklog.md\` |

## Projects
- \`projects/${projectName.toLowerCase().replace(/\s+/g, '-')}.md\`

## Protocol reminder
1. Read this index
2. Read active-work.md
3. Read the relevant project file
4. Check gotchas.md if debugging
5. Update files continuously during work — not just at session end
`,
    },
    {
      path: 'active-work.md',
      content: `# Active Work

> Updated continuously by agents. One section per active task.
> Remove your section when done. Leave it if you crash — the next agent needs to know.
> Agents: check this file before starting work to avoid conflicts.

## In progress

`,
    },
    {
      path: 'decisions.md',
      content: `# Architecture Decisions

> Why things are the way they are.
> Read this before making any significant tech or architecture choice.
> Format: ## YYYY-MM-DD - Decision title

`,
    },
    {
      path: 'worklog.md',
      content: `# Worklog

> Rolling session history. Append a summary at the end of each Claude Code session.
> Newest entries at the top after initial setup. Keep last 30 sessions max.
> Format: ## YYYY-MM-DD [project-name]

`,
    },
    {
      path: 'gotchas.md',
      content: `# Gotchas

> Known bugs, quirks, and workarounds. Check here before spending time debugging.
> Add a gotcha the moment you discover it — don't wait until session end.

`,
    },
    {
      path: 'infra.md',
      content: `# Infrastructure

> Servers, ports, environment variables, services, and credentials references.
> Never store actual secrets here — reference where they live (e.g. 1Password, .env.local).

## Local dev ports
| Project | Port | Notes |
|---|---|---|
| ${projectName} | | |

## Environment variable locations
- \`.env.local\` — never committed, in each project root

## Services in use

`,
    },
    {
      path: 'live-metrics.md',
      content: `# Live Metrics

> Updated by Claude agents or manually. NeuroStack renders each value as a counter widget.
> Format: - **Key**: value  (under ## section headings)
> Percent values (e.g. 68%) render a fill bar. Numeric values render large.

## ${new Date().getFullYear()} — ${projectName}
- **Sessions**: 0
- **Decisions Made**: 0
- **Files Modified**: 0
- **Completion**: 0%
`,
    },
    {
      path: `projects/${projectName.toLowerCase().replace(/\s+/g, '-')}.md`,
      content: `# Project: ${projectName}

**Status**: active
**Stack**:
**Repo**:

## Current work
<!-- What is being actively worked on right now -->

## Recent changes

| Date | Change |
|---|---|
| | |

## Active branches
- \`main\`

## Blockers

## Key gotchas

## Key facts
`,
    },
  ]
}
