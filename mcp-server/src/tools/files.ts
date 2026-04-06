import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveSafe, atomicWrite, readFile, listMdFiles } from "../lib/fsHelpers.js";

export function registerFileTools(server: McpServer, memoryDir: string): void {
  server.tool(
    "list_files",
    "List all .md file paths in the memory directory (paths are relative to the memory dir)",
    {},
    async () => {
      const files = await listMdFiles(memoryDir);
      return {
        content: [{ type: "text", text: files.join("\n") }],
      };
    }
  );

  server.tool(
    "read_file",
    "Read a memory file verbatim. `path` is relative to the memory directory.",
    { path: z.string().describe("Relative path to the .md file") },
    async ({ path: rel }) => {
      const abs = resolveSafe(memoryDir, rel);
      const content = await readFile(abs);
      return {
        content: [{ type: "text", text: content }],
      };
    }
  );

  server.tool(
    "write_file",
    "Full-replace write to a memory file. Creates the file if it does not exist. `path` is relative to the memory directory.",
    {
      path: z.string().describe("Relative path to the .md file"),
      content: z.string().describe("Full file content to write"),
    },
    async ({ path: rel, content }) => {
      const abs = resolveSafe(memoryDir, rel);
      await atomicWrite(abs, content);
      return {
        content: [{ type: "text", text: `Written: ${rel}` }],
      };
    }
  );
}
