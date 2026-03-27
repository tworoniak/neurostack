import type { DecisionEntry } from '../types/memory'

export function parseDecisions(content: string): DecisionEntry[] {
  const entries: DecisionEntry[] = []
  const blocks = content.split(/^##\s+/m).slice(1)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    const header = lines[0].trim()
    const dateMatch = header.match(/^(\d{4}-\d{2}-\d{2})\s*[-–]\s*(.+)/)

    if (!dateMatch) {
      console.warn('[parseDecisions] Skipping malformed entry (expected "YYYY-MM-DD - Title"):', header)
      continue
    }

    const body = lines.slice(1).join('\n').trim()
    entries.push({
      date: dateMatch[1],
      title: dateMatch[2].trim(),
      body,
      slug: dateMatch[2].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    })
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
