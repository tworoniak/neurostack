import type { AgentEntry } from '../types/memory'

export function parseActiveWork(content: string): AgentEntry[] {
  const agents: AgentEntry[] = []
  const blocks = content.split(/^###\s+/m).slice(1)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    const header = lines[0]
    const projectMatch = header.match(/\[(.+?)\]/)
    const taskMatch = header.match(/\]\s*[-–]\s*(.+)/)

    const get = (key: string): string => {
      const line = lines.find(l => l.toLowerCase().includes(`**${key.toLowerCase()}**`))
      return line?.replace(/^-\s*\*\*[^*]+\*\*:\s*/i, '').trim() ?? ''
    }

    const filesTouched = get('files touched')
      .split(',')
      .map(f => f.trim())
      .filter(Boolean)

    const statusRaw = get('status').toLowerCase()
    const status: AgentEntry['status'] =
      statusRaw === 'blocked' ? 'blocked' : statusRaw === 'done' ? 'done' : 'working'

    if (!projectMatch?.[1] && !taskMatch?.[1]) {
      console.warn('[parseActiveWork] Skipping malformed block (no project or task):', header)
      continue
    }

    agents.push({
      id: crypto.randomUUID(),
      project: projectMatch?.[1] ?? 'unknown',
      task: taskMatch?.[1] ?? header.trim(),
      started: get('started'),
      doing: get('doing'),
      filesTouched,
      status,
      rawBlock: block,
    })
  }

  return agents
}
