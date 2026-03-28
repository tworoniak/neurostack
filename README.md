# NeuroStack v1.1

A self-managing memory dashboard for Claude Code. Built on the memory system architecture described by [sammii](https://sammii.dev).

Reads and writes your Claude Code memory files directly from the browser using the File System Access API. No server, no database, no external dependencies — just markdown files and a fast local UI.

---

## Features

| View              | What it does                                                               |
| ----------------- | -------------------------------------------------------------------------- |
| **File Editor**   | Read and edit any `.md` memory file with `⌘S` to save                      |
| **Agent Tracker** | Kanban board parsed from `active-work.md` — working / blocked / done       |
| **Timeline**      | Chronological feed of `decisions.md` + `worklog.md` with quick-add forms   |
| **Search**        | Fuzzy full-text search across all loaded memory files (powered by Fuse.js) |

---

## Getting started

### 1. Install and run

```bash
cd neurostack
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 2. Set up your memory directory

Copy the templates to your Claude memory directory:

```bash
# Find your Claude project hash first (check ~/.claude/projects/)
MEMORY_DIR=~/.claude/projects/<your-project-hash>/memory

mkdir -p $MEMORY_DIR/projects
cp memory-templates/MEMORY.md       $MEMORY_DIR/
cp memory-templates/active-work.md  $MEMORY_DIR/
cp memory-templates/decisions.md    $MEMORY_DIR/
cp memory-templates/gotchas.md      $MEMORY_DIR/
cp memory-templates/worklog.md      $MEMORY_DIR/
cp memory-templates/stack.md        $MEMORY_DIR/
cp memory-templates/infra.md        $MEMORY_DIR/
cp memory-templates/projects/_template.md $MEMORY_DIR/projects/
```

### 3. Wire up each project

Copy `claude-templates/CLAUDE.md` into each project root and update the memory directory path at the top.

### 4. Open in the dashboard

Click **"Open memory directory"** and select your `memory/` folder. The dashboard reads all `.md` files recursively and begins watching for changes every 4 seconds.

---

## The memory system

```
memory/
  MEMORY.md              # Index / routing table (<100 lines)
  active-work.md         # Live multi-agent coordination
  decisions.md           # Architecture decisions with rationale
  gotchas.md             # Known bugs and workarounds
  worklog.md             # Rolling session history (last 30)
  stack.md               # Stack conventions and preferred patterns
  infra.md               # Ports, services, env var locations
  projects/
    usepopcorn-v2.md
    movie-pocket.md
    component-library.md
    antihero-magazine.md
    …
```

### The protocol

**Session start**: Read MEMORY.md → active-work.md → your project file → gotchas.md if debugging

**During work**: Update `active-work.md` when you start/change/finish tasks. Update project files immediately after meaningful changes.

**Session end**: Remove your `active-work.md` entry. Append to `worklog.md`.

**Key rule**: write continuously, not at session end. If an agent crashes, its entry stays in `active-work.md` as a signal.

---

## Tech stack

- Vite + React 18 + TypeScript
- File System Access API (Chrome/Edge/Brave — no Firefox)
- Fuse.js for fuzzy search
- date-fns for date formatting
- DM Mono + Syne (Google Fonts)
- Zero backend, zero dependencies beyond the above

---

## Browser support

The File System Access API requires a Chromium-based browser:

- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Brave
- ❌ Firefox (not supported)
- ❌ Safari (partial, no write access)

---

## Project structure

```
src/
  components/
    layout/      Sidebar, TopBar
    views/       FileEditor, AgentTracker, Timeline, Search, Landing
  hooks/         useMemoryFS, useFileWatcher, useSearch
  lib/           parseActiveWork, parseDecisions, parseWorklog
  types/         memory.ts
  styles/        global.css
memory-templates/   Copy these to your Claude memory directory
claude-templates/   CLAUDE.md — drop into each project root
```
