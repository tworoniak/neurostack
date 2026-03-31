import { useMemo, useState } from 'react'
import type { MemoryDirectory, AgentEntry } from '../../types/memory'
import { parseActiveWork } from '../../lib/parseActiveWork'
import { inputStyle } from '../../styles/formStyles'

interface Props {
  directory: MemoryDirectory | null
  onWrite: (path: string, content: string) => Promise<boolean>
  onNavigateToFile?: (path: string) => void
}

function checkCompliance(agent: AgentEntry): string[] {
  const issues: string[] = []
  if (agent.project === 'unknown') issues.push('Missing [project] bracket in header')
  if (!agent.rawBlock.includes('**Status**')) issues.push('Missing **Status** field')
  if (!agent.rawBlock.includes('**Started**')) issues.push('Missing **Started** field')
  else if (agent.started && !/^\d{4}-\d{2}-\d{2}/.test(agent.started)) issues.push('Malformed timestamp (expected YYYY-MM-DD)')
  return issues
}

const COLUMNS: { id: AgentEntry['status']; label: string; color: string; dimColor: string }[] = [
  { id: 'working', label: 'Working',  color: 'var(--accent)', dimColor: 'var(--accent-dim)' },
  { id: 'blocked', label: 'Blocked',  color: 'var(--red)',    dimColor: 'var(--red-dim)' },
  { id: 'done',    label: 'Done',     color: 'var(--text-muted)', dimColor: 'rgba(136,136,160,0.08)' },
]

function parseStartedMs(s: string): number | null {
  if (!s) return null
  const ms = Date.parse(s.replace(' ', 'T'))
  return isNaN(ms) ? null : ms
}

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m ago`
  if (hours < 24) return `${Math.round(hours)}h ago`
  const days = Math.floor(hours / 24)
  const h = Math.round(hours % 24)
  return h > 0 ? `${days}d ${h}h ago` : `${days}d ago`
}

function AgentCard({ agent, onDone, onRemove, onFix }: {
  agent: AgentEntry
  onDone: (agent: AgentEntry, summary: string) => void
  onRemove: (agent: AgentEntry) => void
  onFix?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [draftSummary, setDraftSummary] = useState('')
  const col = COLUMNS.find(c => c.id === agent.status)!

  const startedMs = parseStartedMs(agent.started)
  const ageHours = startedMs ? (Date.now() - startedMs) / 3_600_000 : null
  const isStale = ageHours !== null && ageHours > 24 && agent.status !== 'done'
  const issues = checkCompliance(agent)

  const startDraft = (e: React.MouseEvent) => {
    e.stopPropagation()
    const base = agent.doing || agent.task
    const files = agent.filesTouched.length > 0
      ? ` [${agent.filesTouched.join(', ')}]`
      : ''
    setDraftSummary(base + files)
    setDrafting(true)
  }

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isStale ? 'rgba(255,181,71,0.04)' : 'var(--bg-raised)',
        border: `1px solid ${isStale ? 'rgba(255,181,71,0.3)' : hovered ? col.color : 'var(--border)'}`,
        borderLeft: `2px solid ${isStale ? 'var(--amber)' : col.color}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <span className={`badge badge-${agent.status}`}>
          {agent.status === 'working' && <span className="pulse-dot" style={{ background: col.color }} />}
          {agent.status}
        </span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 12,
          color: 'var(--text-primary)',
          flex: 1,
          lineHeight: 1.4,
        }}>
          [{agent.project}]
        </span>
        {issues.length > 0 && (
          <span title={issues.join('\n')} style={{ fontSize: 9, color: 'var(--amber)', border: '1px solid rgba(255,181,71,0.4)', borderRadius: 99, padding: '1px 5px', flexShrink: 0, cursor: 'default' }}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
        {agent.task}
      </div>

      {agent.doing && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          → {agent.doing}
        </div>
      )}

      {ageHours !== null && (
        <div style={{ fontSize: 10, color: isStale ? 'var(--amber)' : 'var(--text-muted)', marginTop: 4 }}>
          {isStale && '⚠ stale · '}{formatAge(ageHours)}
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {agent.started && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              started {agent.started}{ageHours !== null ? ` (${formatAge(ageHours)})` : ''}
            </div>
          )}
          {issues.length > 0 && (
            <div style={{ padding: '8px 10px', background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Protocol issues</div>
              {issues.map(issue => (
                <div key={issue} style={{ fontSize: 10, color: 'var(--amber)', opacity: 0.85, marginBottom: 2 }}>· {issue}</div>
              ))}
              {onFix && (
                <button
                  onClick={e => { e.stopPropagation(); onFix() }}
                  style={{ marginTop: 6, padding: '3px 10px', background: 'rgba(255,181,71,0.1)', border: '1px solid rgba(255,181,71,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--amber)', fontSize: 10, cursor: 'pointer' }}
                >
                  Fix in FileEditor →
                </button>
              )}
            </div>
          )}
          {agent.filesTouched.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Files touched
              </div>
              {agent.filesTouched.map(f => (
                <div key={f} style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', padding: '2px 0', opacity: 0.8 }}>
                  {f}
                </div>
              ))}
            </div>
          )}
          {drafting ? (
            <div onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Worklog summary
              </div>
              <textarea
                autoFocus
                value={draftSummary}
                onChange={e => setDraftSummary(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  padding: '6px 8px',
                  resize: 'vertical',
                  marginBottom: 6,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { onDone(agent, draftSummary); setDrafting(false) }}
                  style={{ padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid rgba(78,255,196,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 10, cursor: 'pointer', letterSpacing: '0.04em' }}
                >
                  ✓ Confirm + log
                </button>
                <button
                  onClick={() => setDrafting(false)}
                  style={{ padding: '4px 10px', background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', letterSpacing: '0.04em' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={startDraft}
                style={{ padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid rgba(78,255,196,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 10, cursor: 'pointer', letterSpacing: '0.04em' }}
              >
                ✓ Done + log
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemove(agent) }}
                style={{ padding: '4px 10px', background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', letterSpacing: '0.04em' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AgentTracker({ directory, onWrite, onNavigateToFile }: Props) {
  const rawContent = directory?.files.get('active-work.md')?.content ?? ''
  const worklogContent = directory?.files.get('worklog.md')?.content ?? ''
  const agents = useMemo(() => parseActiveWork(rawContent), [rawContent])

  const [pendingProjectSync, setPendingProjectSync] = useState<{ path: string; project: string; summary: string } | null>(null)
  const [complianceDismissed, setComplianceDismissed] = useState(false)

  const [newProject, setNewProject] = useState('')
  const [newTask, setNewTask] = useState('')
  const [newDoing, setNewDoing] = useState('')
  const [newFiles, setNewFiles] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(false)

  const grouped = useMemo(() => {
    const map: Record<AgentEntry['status'], AgentEntry[]> = { working: [], blocked: [], done: [] }
    for (const a of agents) map[a.status].push(a)
    return map
  }, [agents])

  // Compliance issues across all non-done agents
  const agentsWithIssues = useMemo(() =>
    agents
      .filter(a => a.status !== 'done')
      .map(a => ({ agent: a, issues: checkCompliance(a) }))
      .filter(({ issues }) => issues.length > 0),
  [agents])

  // Detect overlapping filesTouched across active (non-done) agents
  const fileConflicts = useMemo(() => {
    const fileToAgents = new Map<string, AgentEntry[]>()
    for (const agent of agents.filter(a => a.status !== 'done')) {
      for (const f of agent.filesTouched) {
        if (!f) continue
        if (!fileToAgents.has(f)) fileToAgents.set(f, [])
        fileToAgents.get(f)!.push(agent)
      }
    }
    return Array.from(fileToAgents.entries())
      .filter(([, agts]) => agts.length > 1)
      .map(([file, agts]) => ({ file, agents: agts }))
  }, [agents])

  const handleRemoveAgent = async (agent: AgentEntry) => {
    const updated = rawContent.replace('### ' + agent.rawBlock, '')
    await onWrite('active-work.md', updated)
  }

  const handleDoneAgent = async (agent: AgentEntry, summary: string) => {
    const today = new Date().toISOString().slice(0, 10)
    const worklogEntry = `\n## ${today} [${agent.project}]\n- ${summary.trim()}\n`
    await onWrite('worklog.md', worklogContent + worklogEntry)
    await handleRemoveAgent(agent)

    // Offer to sync the project file if it exists
    if (directory) {
      const slug = agent.project.toLowerCase().replace(/\s+/g, '-')
      const candidates = [
        `projects/${agent.project}.md`,
        `projects/${slug}.md`,
        `projects/${agent.project.toLowerCase()}.md`,
      ]
      const found = candidates.find(c => directory.files.has(c))
      if (found) setPendingProjectSync({ path: found, project: agent.project, summary: summary.trim() })
    }
  }

  const staleAgents = useMemo(() => agents.filter(a => {
    if (a.status === 'done') return false
    const ms = parseStartedMs(a.started)
    return ms !== null && (Date.now() - ms) / 3_600_000 > 24
  }), [agents])

  const handleArchiveStale = async () => {
    if (staleAgents.length === 0) return
    const today = new Date().toISOString().slice(0, 10)
    const entries = staleAgents.map(a =>
      `\n## ${today} [${a.project}]\n- archived stale: ${a.task}\n`
    ).join('')
    let updated = rawContent
    for (const a of staleAgents) {
      updated = updated.replace('### ' + a.rawBlock, '')
    }
    await onWrite('worklog.md', worklogContent + entries)
    await onWrite('active-work.md', updated)
  }

  const handleAddAgent = async () => {
    if (!newProject || !newTask) return
    setAddError(false)
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const newBlock = `\n### [${newProject}] - ${newTask}\n- **Started**: ${now}\n- **Doing**: ${newDoing || newTask}\n- **Files touched**: ${newFiles}\n- **Status**: working\n`
    const updated = rawContent + newBlock
    const ok = await onWrite('active-work.md', updated)
    if (ok) {
      setNewProject('')
      setNewTask('')
      setNewDoing('')
      setNewFiles('')
      setAdding(false)
    } else {
      setAddError(true)
    }
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>
            Active Agents
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {agents.length} agent{agents.length !== 1 ? 's' : ''} tracked · reads active-work.md
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {staleAgents.length > 0 && (
            <button
              onClick={handleArchiveStale}
              title={`Archive ${staleAgents.length} stale agent${staleAgents.length !== 1 ? 's' : ''} (>24h old)`}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,181,71,0.08)',
                border: '1px solid rgba(255,181,71,0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--amber)',
                fontSize: 11,
                letterSpacing: '0.05em',
                cursor: 'pointer',
              }}
            >
              ⚠ Archive stale ({staleAgents.length})
            </button>
          )}
          <button
            onClick={() => setAdding(a => !a)}
            style={{
              padding: '6px 14px',
              background: adding ? 'var(--accent-dim)' : 'var(--bg-overlay)',
              border: `1px solid ${adding ? 'rgba(78,255,196,0.3)' : 'var(--border-mid)'}`,
              borderRadius: 'var(--radius-md)',
              color: adding ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11,
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            {adding ? '✕ Cancel' : '+ Add agent'}
          </button>
        </div>
      </div>

      {/* Project file sync prompt */}
      {pendingProjectSync && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(78,255,196,0.2)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: 13, flexShrink: 0 }}>◉</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, flex: 1 }}>
            Update <span style={{ color: 'var(--accent)' }}>{pendingProjectSync.path}</span> current work?
          </span>
          <button
            onClick={async () => {
              const file = directory?.files.get(pendingProjectSync.path)
              if (!file) { setPendingProjectSync(null); return }
              const today = new Date().toISOString().slice(0, 10)
              const replacement = `## Current work\n${pendingProjectSync.summary} (${today})\n`
              const updated = file.content.match(/^## Current work/m)
                ? file.content.replace(/^## Current work[\s\S]*?(?=^## |\s*$)/m, replacement + '\n')
                : file.content + '\n' + replacement
              await onWrite(pendingProjectSync.path, updated)
              setPendingProjectSync(null)
            }}
            style={{ padding: '4px 12px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0D0D0F', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Update
          </button>
          <button
            onClick={() => setPendingProjectSync(null)}
            style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}
          >
            Skip
          </button>
        </div>
      )}

      {/* Blocker alert */}
      {grouped.blocked.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'var(--red-dim)',
          border: '1px solid rgba(255,92,92,0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
        }}>
          <span style={{ color: 'var(--red)', fontSize: 14, flexShrink: 0 }}>⚠</span>
          <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>
            {grouped.blocked.length} agent{grouped.blocked.length !== 1 ? 's' : ''} blocked
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            — {grouped.blocked.map(a => `[${a.project}]`).join(', ')}
          </span>
        </div>
      )}

      {/* Compliance issues banner */}
      {agentsWithIssues.length > 0 && !complianceDismissed && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'rgba(255,181,71,0.06)',
          border: '1px solid rgba(255,181,71,0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}>
          <span style={{ color: 'var(--amber)', fontSize: 13, flexShrink: 0 }}>⚑</span>
          <span style={{ color: 'var(--amber)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            {agentsWithIssues.reduce((n, { issues }) => n + issues.length, 0)} compliance issue{agentsWithIssues.reduce((n, { issues }) => n + issues.length, 0) !== 1 ? 's' : ''}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, flex: 1 }}>
            — {agentsWithIssues.map(({ agent }) => `[${agent.project}]`).join(', ')}
          </span>
          <button
            onClick={() => setComplianceDismissed(true)}
            style={{ padding: '2px 8px', background: 'transparent', border: '1px solid rgba(255,181,71,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--amber)', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* File conflict warning */}
      {fileConflicts.length > 0 && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(255,181,71,0.08)',
          border: '1px solid rgba(255,181,71,0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ color: 'var(--amber)', fontSize: 13 }}>⚡</span>
            <span style={{ color: 'var(--amber)', fontSize: 12, fontWeight: 600 }}>
              {fileConflicts.length} file conflict{fileConflicts.length !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>— multiple agents touching the same file</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {fileConflicts.map(({ file, agents: conflicting }) => (
              <div key={file} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--amber)', opacity: 0.85 }}>{file}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  ← {conflicting.map(a => `[${a.project}]`).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add agent form */}
      {adding && (
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: 24,
        }} className="fade-up">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            New agent entry
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              autoFocus
              placeholder="project-name"
              value={newProject}
              onChange={e => setNewProject(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Task description"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              style={{ ...inputStyle, flex: 2 }}
            />
          </div>
          <input
            placeholder="Currently doing… (optional)"
            value={newDoing}
            onChange={e => setNewDoing(e.target.value)}
            style={{ ...inputStyle, width: '100%', marginBottom: 10 }}
          />
          <input
            placeholder="Files touched (comma-separated, optional)"
            value={newFiles}
            onChange={e => setNewFiles(e.target.value)}
            style={{ ...inputStyle, width: '100%', marginBottom: 10 }}
          />
          <button
            onClick={handleAddAgent}
            disabled={!newProject || !newTask}
            style={{
              padding: '6px 16px',
              background: newProject && newTask ? 'var(--accent-dim)' : 'var(--bg-overlay)',
              border: `1px solid ${newProject && newTask ? 'rgba(78,255,196,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: newProject && newTask ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 11,
              cursor: newProject && newTask ? 'pointer' : 'default',
            }}
          >
            Add to active-work.md
          </button>
          {addError && <span style={{ fontSize: 11, color: 'var(--red)', marginTop: 8, display: 'block' }}>Write failed — check directory permissions</span>}
        </div>
      )}

      {/* No file warning */}
      {directory && !directory.files.has('active-work.md') && (
        <div style={{
          padding: '16px',
          background: 'var(--amber-dim)',
          border: '1px solid rgba(255,181,71,0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--amber)',
          fontSize: 12,
          marginBottom: 24,
        }}>
          ⚠ active-work.md not found in this directory. Add it from the memory-templates folder.
        </div>
      )}

      {/* Kanban columns */}
      {agents.length === 0 && directory?.files.has('active-work.md') ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 0',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>◈</div>
          No active agents found in active-work.md
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {COLUMNS.map(col => (
            <div key={col.id}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: `1px solid ${col.dimColor}`,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: col.color, flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 12,
                  color: col.color,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {col.label}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  background: col.dimColor,
                  color: col.color,
                  fontSize: 10,
                  padding: '1px 7px',
                  borderRadius: 99,
                }}>
                  {grouped[col.id].length}
                </span>
              </div>
              {grouped[col.id].map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onDone={handleDoneAgent}
                  onRemove={handleRemoveAgent}
                  onFix={onNavigateToFile ? () => onNavigateToFile('active-work.md') : undefined}
                />
              ))}
              {grouped[col.id].length === 0 && (
                <div style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border)',
                }}>
                  empty
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

