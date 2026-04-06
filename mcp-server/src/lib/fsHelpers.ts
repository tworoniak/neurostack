import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Resolve `rel` relative to `base`, rejecting any path that escapes `base`.
 * Throws if the resolved path is outside the base directory.
 */
export function resolveSafe(base: string, rel: string): string {
  const resolved = path.resolve(base, rel);
  const normalBase = path.resolve(base);
  if (!resolved.startsWith(normalBase + path.sep) && resolved !== normalBase) {
    console.error(`[neurostack-mcp] Path traversal rejected: "${rel}" escapes memory directory`);
    throw new Error(`Path traversal rejected: "${rel}" escapes memory directory`);
  }
  return resolved;
}

/**
 * Atomically write `content` to `filePath`.
 * Writes to a .tmp file first, then renames — prevents corruption on crash.
 */
export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = filePath + ".tmp";
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, filePath);
}

/**
 * Read a file as UTF-8 text.
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

/**
 * Recursively list all .md file paths under `dir`, relative to `dir`.
 */
export async function listMdFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  await walk(dir, dir, results);
  return results.sort();
}

async function walk(base: string, current: string, out: string[]): Promise<void> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(base, full, out);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(path.relative(base, full));
    }
  }
}
