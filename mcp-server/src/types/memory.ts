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
  status?: string
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
  resolved: string
  rawBlock: string
}
