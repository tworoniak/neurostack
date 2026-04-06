import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveSafe, atomicWrite, readFile } from "../lib/fsHelpers.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
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

      await atomicWrite(abs, content.trimEnd() + entry);
      return {
        content: [{ type: "text", text: `Appended worklog entry for [${project}] on ${date}` }],
      };
    }
  );
}
