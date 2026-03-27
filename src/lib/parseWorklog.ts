import type { WorklogEntry } from '../types/memory'

export function parseWorklog(content: string): WorklogEntry[] {
  const entries: WorklogEntry[] = []
  const blocks = content.split(/^##\s+/m).slice(1)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    const header = lines[0].trim()
    const dateMatch = header.match(/^(\d{4}-\d{2}-\d{2})/)
    const projectMatch = header.match(/\[(.+?)\]/)

    const summary = lines[1]?.replace(/^[-*]\s*/, '').trim() ?? ''
    const details = lines.slice(2).join('\n').trim()

    if (!dateMatch?.[1]) {
      console.warn('[parseWorklog] Skipping malformed entry (expected "YYYY-MM-DD [project]"):', header)
      continue
    }
    entries.push({
      date: dateMatch[1],
      project: projectMatch?.[1] ?? header,
      summary,
      details,
    })
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
