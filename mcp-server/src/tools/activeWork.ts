import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveSafe, atomicWrite, readFile } from "../lib/fsHelpers.js";

const ACTIVE_WORK_FILE = "active-work.md";
const FALLBACK_HEADER =
  "# Active Work\n\n> Updated continuously by agents. One section per active task.\n> Remove your section when done. Leave it if you crash — the next agent needs to know.\n> Agents: check this file before starting work to avoid conflicts.\n\n## In progress\n\n";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Split active-work.md content into [intro, ...agentBlocks].
 * Each agent block is the raw text after "### " (not including the "### " prefix).
 */
function splitBlocks(content: string): { intro: string; blocks: string[] } {
  const parts = content.split(/^###\s+/m);
  return { intro: parts[0], blocks: parts.slice(1) };
}

function joinBlocks(intro: string, blocks: string[]): string {
  return intro + blocks.map(b => `### ${b}`).join("");
}

/** True if a block starts with `{agentId} [` (case-insensitive). */
function matchesAgent(block: string, agentId: string): boolean {
  const lower = block.toLowerCase();
  const prefix = agentId.toLowerCase();
  return lower.startsWith(`${prefix} [`) || lower.startsWith(`${prefix}[`);
}

function buildBlock(
  agentId: string,
  project: string,
  task: string,
  status: string,
  startDate: string,
  doing?: string,
  filesTouched?: string
): string {
  const doingLine = doing ? `\n- **Doing**: ${doing}` : "";
  const filesLine = filesTouched ? `\n- **Files touched**: ${filesTouched}` : "";
  return `${agentId} [${project}] — ${task}\n- **Status**: ${status}\n- **Started**: ${startDate}${doingLine}${filesLine}\n\n`;
}

export function registerActiveWorkTools(server: McpServer, memoryDir: string): void {
  server.tool(
    "update_active_work",
    "Upsert an agent block in active-work.md. Creates the block if agent_id is not found; replaces it if found.",
    {
      agent_id: z.string().describe("Unique agent identifier, e.g. 'Claude' or 'agent-1'"),
      project: z.string().describe("Project name written inside brackets, e.g. 'neurostack'"),
      task: z.string().describe("Short task description"),
      status: z.enum(["working", "blocked", "done"]).describe("Current status"),
      doing: z.string().optional().describe("What the agent is doing right now"),
      files_touched: z.string().optional().describe("Comma-separated list of files being modified"),
      started: z.string().optional().describe("ISO date (YYYY-MM-DD) when work started — defaults to today"),
    },
    async ({ agent_id, project, task, status, doing, files_touched, started }) => {
      const abs = resolveSafe(memoryDir, ACTIVE_WORK_FILE);
      let content: string;
      try {
        content = await readFile(abs);
      } catch {
        content = FALLBACK_HEADER;
      }

      const startDate = started ?? today();
      const newBlock = buildBlock(agent_id, project, task, status, startDate, doing, files_touched);

      const { intro, blocks } = splitBlocks(content);
      const idx = blocks.findIndex(b => matchesAgent(b, agent_id));

      if (idx >= 0) {
        blocks[idx] = newBlock;
      } else {
        blocks.push(newBlock);
      }

      await atomicWrite(abs, joinBlocks(intro, blocks));
      return {
        content: [{ type: "text", text: `${idx >= 0 ? "Updated" : "Created"} block for ${agent_id} in active-work.md` }],
      };
    }
  );

  server.tool(
    "remove_from_active_work",
    "Remove an agent's block from active-work.md by agent_id.",
    {
      agent_id: z.string().describe("Agent identifier to remove"),
    },
    async ({ agent_id }) => {
      const abs = resolveSafe(memoryDir, ACTIVE_WORK_FILE);
      const content = await readFile(abs);

      const { intro, blocks } = splitBlocks(content);
      const filtered = blocks.filter(b => !matchesAgent(b, agent_id));

      if (filtered.length === blocks.length) {
        return {
          content: [{ type: "text", text: `No block found for agent_id "${agent_id}" — nothing removed` }],
        };
      }

      await atomicWrite(abs, joinBlocks(intro, filtered));
      return {
        content: [{ type: "text", text: `Removed ${agent_id} from active-work.md` }],
      };
    }
  );
}
