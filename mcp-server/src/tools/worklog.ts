import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveSafe, atomicWrite, readFile } from "../lib/fsHelpers.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Insert a new entry at the top of the entry list, after any preamble
 * (title, description lines) and before the first existing ## entry.
 */
function prependEntry(existing: string, entry: string): string {
  const idx = existing.search(/^## /m);
  if (idx === -1) {
    return existing.trimEnd() + entry;
  }
  return existing.slice(0, idx).trimEnd() + entry + "\n" + existing.slice(idx);
}

export function registerWorklogTools(server: McpServer, memoryDir: string): void {
  server.tool(
    "append_worklog",
    "Append a worklog entry to worklog.md. Format: ## YYYY-MM-DD [project] / - summary.",
    {
      project: z.string().min(1).describe("Project name (written inside brackets in the header)"),
      summary: z.string().min(1).describe("One-line summary of the session"),
      files_touched: z.string().optional().describe("Comma-separated list of files modified"),
    },
    async ({ project, summary, files_touched }) => {
      const abs = resolveSafe(memoryDir, "worklog.md");
      let content: string;
      try {
        content = await readFile(abs);
      } catch {
        content = "";
      }

      const date = today();
      const filesLine = files_touched ? `\n  - Files: ${files_touched}` : "";
      const entry = `\n## ${date} [${project}]\n- ${summary}${filesLine}\n`;

      await atomicWrite(abs, prependEntry(content, entry));
      return {
        content: [{ type: "text", text: `Appended worklog entry for [${project}] on ${date}` }],
      };
    }
  );
}
