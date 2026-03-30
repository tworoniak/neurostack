import type { GotchaEntry } from '../types/memory'

export function parseGotchas(content: string): GotchaEntry[] {
  const entries: GotchaEntry[] = []
  const blocks = content.split(/^##\s+/m).slice(1)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    const title = lines[0].trim()

    // Skip meta sections (Format block, Examples header, HTML comments)
    if (!title || title.toLowerCase() === 'format' || title.toLowerCase().startsWith('examples')) continue

    const get = (key: string): string => {
      const line = lines.find(l => l.toLowerCase().includes(`**${key.toLowerCase()}**`))
      return line?.replace(/^-\s*\*\*[^*]+\*\*:\s*/i, '').trim() ?? ''
    }

    const fix = get('fix')
    // Skip blocks with no fix — likely template/comment sections
    if (!fix) continue

    entries.push({
      id: crypto.randomUUID(),
      title,
      affects: get('affects'),
      symptom: get('symptom'),
      fix,
      dateFound: get('date found'),
      rawBlock: block,
    })
  }

  return entries
}
