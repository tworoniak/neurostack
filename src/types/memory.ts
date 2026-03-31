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
  affects: string
  symptom: string
  fix: string
  dateFound: string
  rawBlock: string
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

export interface ActivityEvent {
  path: string
  timestamp: number
  prevLines: number
  newLines: number
}

export interface ProjectEntry {
  name: string
  handle: FileSystemDirectoryHandle
}

export type ViewId = 'overview' | 'editor' | 'agents' | 'projects' | 'timeline' | 'decisions' | 'gotchas' | 'infra' | 'metrics' | 'search' | 'activity'

// File System Access API — not yet in all TypeScript DOM lib versions
declare global {
  function showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>

  interface FileSystemHandle {
    requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
  }
}
