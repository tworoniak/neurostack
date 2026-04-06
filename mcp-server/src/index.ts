import * as path from "node:path";
import * as fs from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFileTools } from "./tools/files.js";
import { registerWorklogTools } from "./tools/worklog.js";
import { registerActiveWorkTools } from "./tools/activeWork.js";
import { registerGotchaTools } from "./tools/gotchas.js";
import { registerDecisionTools } from "./tools/decisions.js";
import { registerSearchTools } from "./tools/search.js";

const memoryDirArg = process.argv[2];

if (!memoryDirArg) {
  console.error("Usage: node dist/index.js <memory-dir>");
  process.exit(1);
}

const memoryDir = path.resolve(memoryDirArg);

if (!fs.existsSync(memoryDir)) {
  console.error(`Memory directory not found: ${memoryDir}`);
  process.exit(1);
}

const server = new McpServer({
  name: "neurostack",
  version: "0.2.0",
});

registerFileTools(server, memoryDir);
registerWorklogTools(server, memoryDir);
registerActiveWorkTools(server, memoryDir);
registerGotchaTools(server, memoryDir);
registerDecisionTools(server, memoryDir);
registerSearchTools(server, memoryDir);

const transport = new StdioServerTransport();
await server.connect(transport);
