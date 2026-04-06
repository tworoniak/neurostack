import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveSafe, atomicWrite, readFile } from "../lib/fsHelpers.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function registerGotchaTools(server: McpServer, memoryDir: string): void {
  server.tool(
    "add_gotcha",
    "Append a gotcha entry to gotchas.md.",
    {
      title: z.string().min(1).describe("Short title describing the gotcha"),
      affects: z.string().min(1).describe("Component or area affected (e.g. 'FileEditor', 'useMemoryFS')"),
      symptom: z.string().min(1).describe("What you observe when the bug is present"),
      fix: z.string().min(1).describe("How to fix or work around the gotcha"),
    },
    async ({ title, affects, symptom, fix }) => {
      const abs = resolveSafe(memoryDir, "gotchas.md");
      let content: string;
      try {
        content = await readFile(abs);
      } catch {
        content = "";
      }

      const date = today();
      const entry =
        `\n## ${title}\n` +
        `- **Affects**: ${affects}\n` +
        `- **Symptom**: ${symptom}\n` +
        `- **Fix**: ${fix}\n` +
        `- **Date found**: ${date}\n`;

      await atomicWrite(abs, content.trimEnd() + entry);
      return {
        content: [{ type: "text", text: `Added gotcha: "${title}"` }],
      };
    }
  );
}
