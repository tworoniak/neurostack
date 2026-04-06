import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveSafe, atomicWrite, readFile } from "../lib/fsHelpers.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function registerDecisionTools(server: McpServer, memoryDir: string): void {
  server.tool(
    "add_decision",
    "Append a decision entry to decisions.md. Format: ## YYYY-MM-DD - Title / body.",
    {
      title: z.string().describe("Decision title"),
      body: z.string().describe("Decision body — rationale, context, trade-offs, consequences"),
      date: z.string().optional().describe("ISO date (YYYY-MM-DD) — defaults to today"),
    },
    async ({ title, body, date }) => {
      const abs = resolveSafe(memoryDir, "decisions.md");
      let content: string;
      try {
        content = await readFile(abs);
      } catch {
        content = "";
      }

      const dateStr = date ?? today();
      const entry = `\n## ${dateStr} - ${title}\n${body}\n`;

      await atomicWrite(abs, content.trimEnd() + entry);
      return {
        content: [{ type: "text", text: `Added decision: "${dateStr} - ${title}"` }],
      };
    }
  );
}
