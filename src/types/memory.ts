export interface AgentEntry {
  id: string
  project: string
  task: string
  started: string
  doing: string
  filesTouched: string[]
  status: 'working' | 'blocked' | 'done'
  rawBlock: string
}

export interface DecisionEntry {
  date: string
  title: string
  body: string
  slug: string
}

export interface WorklogEntry {
  date: string
  project: string
  summary: string
  details: string
}

export interface GotchaEntry {
  id: string
  title: string
  body: string
}

export interface MemoryFile {
  name: string
  path: string
  content: string
  lastModified: number
}

export interface MemoryDirectory {
  handle: FileSystemDirectoryHandle
  files: Map<string, MemoryFile>
}

export type ViewId = 'editor' | 'agents' | 'timeline' | 'search'
