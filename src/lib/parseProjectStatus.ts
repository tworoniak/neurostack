export interface ProjectStatusEntry {
  id: string
  name: string
  path: string
  status: 'active' | 'paused' | 'shipped' | 'unknown'
  stack: string
  devPort: string
  repo: string
  currentWork: string
  blockers: string
  activeBranches: string[]
  recentChanges: { date: string; change: string }[]
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i')
  return content.match(regex)?.[1]?.trim() ?? ''
}

function extractFrontmatterField(content: string, key: string): string {
  const regex = new RegExp(`^\\*\\*${key}\\*\\*:\\s*(.+)$`, 'im')
  return content.match(regex)?.[1]?.trim() ?? ''
}

export function parseProjectStatus(path: string, content: string): ProjectStatusEntry | null {
  // Skip template files
  if (content.includes('[Name]') || path.includes('_template')) return null

  const nameFromPath = path.split('/').pop()?.replace(/\.md$/, '') ?? path

  const rawStatus = extractFrontmatterField(content, 'Status').toLowerCase()
  const status: ProjectStatusEntry['status'] =
    rawStatus.includes('active') ? 'active'
    : rawStatus.includes('paused') ? 'paused'
    : rawStatus.includes('shipped') ? 'shipped'
    : 'unknown'

  const currentWork = extractSection(content, 'Current work')
  const blockersRaw = extractSection(content, 'Blockers')
  const blockers = blockersRaw.replace(/<!--[\s\S]*?-->/g, '').trim()

  const branchSection = extractSection(content, 'Active branches')
  const activeBranches = branchSection
    .split('\n')
    .map(l => l.replace(/^-\s*`?/, '').replace(/`$/, '').trim())
    .filter(l => l && !l.startsWith('<!--'))

  const changesSection = extractSection(content, 'Recent changes')
  const recentChanges: { date: string; change: string }[] = []
  for (const line of changesSection.split('\n')) {
    // Match markdown table rows: | date | change |
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/)
    if (match && match[1] !== '---' && match[1].trim() !== 'Date') {
      const date = match[1].trim()
      const change = match[2].trim()
      if (date && change) recentChanges.push({ date, change })
    }
  }

  return {
    id: path,
    name: nameFromPath,
    path,
    status,
    stack: extractFrontmatterField(content, 'Stack'),
    devPort: extractFrontmatterField(content, 'Dev port'),
    repo: extractFrontmatterField(content, 'Repo'),
    currentWork: currentWork.replace(/<!--[\s\S]*?-->/g, '').trim(),
    blockers,
    activeBranches,
    recentChanges,
  }
}
