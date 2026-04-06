# neurostack-mcp

Local Node.js MCP server that wraps the NeuroStack memory directory with schema-enforced, atomic tools. Agents use these tools instead of writing raw markdown directly.

## Build

```bash
npm install
npm run build
```

Output: `dist/index.js`

## Tools

| Tool | Description |
|---|---|
| `list_files` | List all `.md` paths in the memory directory |
| `read_file` | Read a file verbatim |
| `write_file` | Full-replace write (atomic) |
| `search_files` | Case-insensitive line-level search across all files |
| `append_worklog` | Append a session entry to `worklog.md` |
| `update_active_work` | Upsert an agent block in `active-work.md` |
| `remove_from_active_work` | Remove an agent's block by `agent_id` |
| `add_gotcha` | Append a gotcha entry to `gotchas.md` |
| `add_decision` | Append a decision entry to `decisions.md` |

All writes are atomic (`.tmp` → rename). Path traversal outside the memory directory is rejected.

## Connect from Claude Code

The server starts **automatically** at session start — no manual launch needed. Do this once per machine:

### Step 1 — Build

```bash
cd /path/to/neurostack/mcp-server
npm install
npm run build
# produces dist/index.js
```

### Step 2 — Find your memory directory path

The memory directory lives inside your Claude Code project cache:

```
~/.claude/projects/<project-hash>/memory
```

To find the hash, run:

```bash
ls ~/.claude/projects/
```

Each directory is your project root path with slashes replaced by dashes. For example, a project at `/Users/alice/code/neurostack` becomes `-Users-alice-code-neurostack`.

### Step 3 — Add to settings.json

Add the following to `.claude/settings.json` in your project root (create it if it doesn't exist), substituting the two paths:

```json
{
  "mcpServers": {
    "neurostack": {
      "command": "node",
      "args": [
        "/absolute/path/to/neurostack/mcp-server/dist/index.js",
        "/Users/<you>/.claude/projects/<project-hash>/memory"
      ]
    }
  }
}
```

### Step 4 — Verify

Start a new Claude Code session in your project, then run:

```
/mcp
```

You should see `neurostack` listed as a connected server with all tools available. You can also sanity-check with:

```
list_files
read_file MEMORY.md
```

> **After a code change:** re-run `npm run build` in `mcp-server/` and restart the Claude Code session — the server process is not hot-reloaded.

## Session protocol (using MCP tools)

**Session start**
```
read_file MEMORY.md
read_file active-work.md
read_file projects/<your-project>.md
```

**Claim your task**
```
update_active_work agent_id="Claude" project="my-project" task="what you're doing" status="working"
```

**Search before reading everything**
```
search_files query="IndexedDB" 
search_files query="stale handle" path_filter="gotchas"
```

**Log a gotcha when you find one**
```
add_gotcha title="..." affects="..." symptom="..." fix="..."
```

**Log a decision**
```
add_decision title="..." body="- Chose X over Y\n- Reason: ..."
```

**Session end**
```
append_worklog project="my-project" summary="what was done" files_touched="src/foo.ts, src/bar.ts"
remove_from_active_work agent_id="Claude"
```
