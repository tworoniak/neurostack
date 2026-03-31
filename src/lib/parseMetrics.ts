export interface MetricEntry {
  key: string
  value: string
  numericValue: number | null
}

export interface MetricSection {
  heading: string
  metrics: MetricEntry[]
}

function parseNumeric(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').replace(/%$/, '').trim()
  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

export function parseMetrics(content: string): MetricSection[] {
  const sections: MetricSection[] = []
  const blocks = content.split(/^##\s+/m).slice(1)

  for (const block of blocks) {
    const lines = block.split('\n')
    const heading = lines[0].trim()
    const metrics: MetricEntry[] = []

    for (const line of lines.slice(1)) {
      // Match: - **Key**: value  OR  - Key: value  OR  Key: value
      const boldMatch = line.match(/^[-*]?\s*\*\*(.+?)\*\*:\s*(.+)$/)
      const plainMatch = line.match(/^[-*]?\s*([^*:][^:]*?):\s*(.+)$/)
      const match = boldMatch ?? plainMatch
      if (!match) continue
      const key = match[1].trim()
      const value = match[2].trim()
      if (!key || !value) continue
      metrics.push({ key, value, numericValue: parseNumeric(value) })
    }

    if (metrics.length > 0) {
      sections.push({ heading, metrics })
    }
  }

  return sections
}
