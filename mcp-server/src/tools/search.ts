import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listMdFiles, readFile, resolveSafe } from "../lib/fsHelpers.js";

interface SearchResult {
  path: string;
  line: number;
  content: string;
}

export function registerSearchTools(server: McpServer, memoryDir: string): void {
  server.tool(
    "search_files",
    "Case-insensitive line-level substring search across all .md files in the memory directory. Returns matching lines with their file path and 1-based line number.",
    {
      query: z.string().min(1).describe("Substring to search for (case-insensitive)"),
      path_filter: z.string().optional().describe("Optional glob-style prefix filter, e.g. 'projects/' to search only project files"),
    },
    async ({ query, path_filter }) => {
      const files = await listMdFiles(memoryDir);
      const lower = query.toLowerCase();
      const results: SearchResult[] = [];

      for (const rel of files) {
        if (path_filter && !rel.startsWith(path_filter)) continue;
        const abs = resolveSafe(memoryDir, rel);
        let content: string;
        try {
          content = await readFile(abs);
        } catch {
          continue;
        }
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(lower)) {
            results.push({ path: rel, line: i + 1, content: lines[i] });
          }
        }
      }

      if (results.length === 0) {
        return { content: [{ type: "text", text: `No matches for "${query}"` }] };
      }

      const text = results
        .map(r => `${r.path}:${r.line}: ${r.content}`)
        .join("\n");

      return { content: [{ type: "text", text: text }] };
    }
  );
}
