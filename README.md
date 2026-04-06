# NeuroStack

A self-managing memory dashboard for Claude Code. Built on the memory system architecture described by [sammii](https://sammii.dev).

Reads and writes your Claude Code memory files directly from the browser using the File System Access API. No server, no database, no external dependencies — just markdown files and a fast local UI.

---

## Views

| View | What it does |
|---|---|
| **Overview** | KPI strip, GitHub-style activity heatmap (with day drill-down), project activity bar chart, agent donut, decision velocity line chart |
| **File Editor** | Read and edit any `.md` file — `⌘S` save, `↺` single-file refresh, `⌘⇧R` full refresh, back/forward history, inline `⌘F` find, rename/delete from file tree, new file creation |
| **Agent Tracker** | Kanban parsed from `active-work.md` — working / blocked / done. Stale detection (>24h amber), bulk archive, conflict detection when agents share files, protocol compliance checker |
| **Project Board** | Kanban parsed from `projects/*.md` — active / paused / shipped. Blocker alert banner, localhost dev-port links |
| **Timeline** | Chronological feed of `decisions.md` + `worklog.md` with quick-add forms and worklog compaction (groups entries >30d into monthly archives) |
| **Decisions** | Standalone decisions view — tag extraction, deprecated/archived status badge, search bar, expandable card grid, quick-add |
| **Gotchas** | Search-first cards parsed from `gotchas.md` — open/resolved filter, quick-add |
| **Infra** | Structured read-only view of `infra.md` — auto-detects tables vs bullet lists, copy-to-clipboard on every value |
| **Metrics** | Counter widgets parsed from `live-metrics.md` — inline value editing, progress bars for percent values |
| **Activity Feed** | Rolling log of file changes (last 200 events) — time-ago, line delta, click row to open file |
| **Search** | Fuzzy full-text search across all loaded memory files (Fuse.js), with surrounding context lines |

---

## MCP Server

`mcp-server/` is a local Node.js MCP server that gives Claude Code agents schema-enforced tools for reading and writing memory files — so agents don't need to know the markdown format.

**Tools (Phase 1 — raw file access):**
- `list_files` — list all `.md` paths in the memory directory
- `read_file` — read a file verbatim
- `write_file` — full-replace write (atomic)

**Tools (Phase 2 — structured writes):**
- `append_worklog` — append a `## YYYY-MM-DD [project]` entry to `worklog.md`
- `update_active_work` — upsert an agent block in `active-work.md`
- `remove_from_active_work` — remove an agent's block by `agent_id`
- `add_gotcha` — append a formatted gotcha entry to `gotchas.md`
- `add_decision` — append a `## YYYY-MM-DD - title` entry to `decisions.md`

All writes are atomic (`.tmp` → rename). Path traversal is rejected.

### Connect the MCP server

```bash
cd mcp-server
npm install
npm run build
```

Add to `.claude/settings.json` (update the path to your memory directory):

```json
{
  "mcpServers": {
    "neurostack": {
      "command": "node",
      "args": [
        "/absolute/path/to/neurostack/mcp-server/dist/index.js",
        "/Users/you/.claude/projects/<project-hash>/memory"
      ]
    }
  }
}
```

---

## Getting started

### 1. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Requires Chrome, Edge, or Brave (see browser support below).

### 2. Bootstrap a memory directory

Click **"✦ New project"** on the landing page to scaffold a fresh memory directory with all required files, or copy the templates manually:

```bash
MEMORY_DIR=~/.claude/projects/<your-project-hash>/memory

mkdir -p $MEMORY_DIR/projects
cp memory-templates/MEMORY.md            $MEMORY_DIR/
cp memory-templates/active-work.md       $MEMORY_DIR/
cp memory-templates/decisions.md         $MEMORY_DIR/
cp memory-templates/gotchas.md           $MEMORY_DIR/
cp memory-templates/worklog.md           $MEMORY_DIR/
cp memory-templates/stack.md             $MEMORY_DIR/
cp memory-templates/infra.md             $MEMORY_DIR/
cp memory-templates/live-metrics.md      $MEMORY_DIR/
cp memory-templates/projects/_template.md $MEMORY_DIR/projects/
```

### 3. Wire up each project

Copy `claude-templates/CLAUDE.md` into each project root and update the memory directory path at the top.

### 4. Open in the dashboard

Click **"Open memory directory"** and select your `memory/` folder. The dashboard reads all `.md` files recursively and polls for changes every 4 seconds (configurable via the TopBar interval pill: 2s / 4s / 10s / 30s / manual).

---

## The memory system

```
memory/
  MEMORY.md              # Index / routing table (<200 lines)
  active-work.md         # Live multi-agent coordination
  decisions.md           # Architecture decisions with rationale
  gotchas.md             # Known bugs and workarounds
  worklog.md             # Rolling session history
  stack.md               # Stack conventions and preferred patterns
  infra.md               # Ports, services, env var locations
  live-metrics.md        # Counter metrics (sessions, files, etc.)
  projects/
    my-project.md
    …
```

### The protocol

**Session start**: Read `MEMORY.md` → `active-work.md` → your project file → `gotchas.md` if debugging.

**During work**: Add your entry to `active-work.md`. Update project files immediately after meaningful changes.

**Session end**: Remove your `active-work.md` entry. Append to `worklog.md`. Update `live-metrics.md`.

**Key rule**: write continuously, not at session end. If an agent crashes, its entry stays in `active-work.md` as a signal to the next agent.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5.4 |
| Routing | react-router-dom v6 |
| File system | File System Access API (browser native) |
| Charts | Recharts |
| Search | Fuse.js (fuzzy, threshold 0.35) |
| Markdown | react-markdown + remark-gfm |
| Utilities | clsx, date-fns |
| Styling | CSS variables — no Tailwind or SCSS |
| Fonts | Syne (headings), DM Mono (body/code) |
| MCP server | Node.js + `@modelcontextprotocol/sdk` |

---

## Browser support

The File System Access API requires a Chromium-based browser:

- Chrome 86+
- Edge 86+
- Brave
- Firefox — not supported
- Safari — partial, no write access

---

## Project structure

```
src/
  components/
    layout/     Sidebar.tsx, TopBar.tsx
    views/      Overview, FileEditor, AgentTracker, ProjectBoard,
                Timeline, Decisions, Gotchas, InfraView, MetricsView,
                ActivityFeed, Search, SessionGuide, Landing
  hooks/        useMemoryFS, useFileWatcher, useSearch
  lib/          parseActiveWork, parseDecisions, parseWorklog,
                parseWorklogStats, parseGotchas, parseProjectStatus,
                parseMetrics, bootstrapTemplates
  types/        memory.ts
  styles/       global.css, formStyles.ts
mcp-server/
  src/
    lib/        fsHelpers, parseActiveWork, parseWorklog,
                parseGotchas, parseDecisions
    tools/      files, worklog, activeWork, gotchas, decisions
    types/      memory.ts
    index.ts
memory-templates/   Copy these to your Claude memory directory
claude-templates/   CLAUDE.md — drop into each project root
```
