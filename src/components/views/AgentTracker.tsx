import { useMemo, useState } from 'react'
import type { MemoryDirectory, AgentEntry } from '../../types/memory'
import { parseActiveWork } from '../../lib/parseActiveWork'

interface Props {
  directory: MemoryDirectory | null
  onWrite: (path: string, content: string) => Promise<boolean>
}

const COLUMNS: { id: AgentEntry['status']; label: string; color: string; dimColor: string }[] = [
  { id: 'working', label: 'Working',  color: 'var(--accent)', dimColor: 'var(--accent-dim)' },
  { id: 'blocked', label: 'Blocked',  color: 'var(--red)',    dimColor: 'var(--red-dim)' },
  { id: 'done',    label: 'Done',     color: 'var(--text-muted)', dimColor: 'rgba(136,136,160,0.08)' },
]

function AgentCard({ agent }: { agent: AgentEntry }) {
  const [expanded, setExpanded] = useState(false)
  const col = COLUMNS.find(c => c.id === agent.status)!

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderLeft: `2px solid ${col.color}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        marginBottom: 8,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = col.color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
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
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
        {agent.task}
      </div>

      {agent.doing && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          → {agent.doing}
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {agent.started && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              started {agent.started}
            </div>
          )}
          {agent.filesTouched.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Files touched
              </div>
              {agent.filesTouched.map(f => (
                <div key={f} style={{
                  fontSize: 11,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 0',
                  opacity: 0.8,
                }}>
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AgentTracker({ directory, onWrite }: Props) {
  const rawContent = directory?.files.get('active-work.md')?.content ?? ''
  const agents = useMemo(() => parseActiveWork(rawContent), [rawContent])

  const [newProject, setNewProject] = useState('')
  const [newTask, setNewTask] = useState('')
  const [newDoing, setNewDoing] = useState('')
  const [adding, setAdding] = useState(false)

  const grouped = useMemo(() => {
    const map: Record<AgentEntry['status'], AgentEntry[]> = { working: [], blocked: [], done: [] }
    for (const a of agents) map[a.status].push(a)
    return map
  }, [agents])

  const handleAddAgent = async () => {
    if (!newProject || !newTask) return
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const newBlock = `\n### [${newProject}] - ${newTask}\n- **Started**: ${now}\n- **Doing**: ${newDoing || newTask}\n- **Files touched**: \n- **Status**: working\n`
    const updated = rawContent + newBlock
    await onWrite('active-work.md', updated)
    setNewProject('')
    setNewTask('')
    setNewDoing('')
    setAdding(false)
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
                <AgentCard key={agent.id} agent={agent} />
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

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '7px 10px',
  background: 'var(--bg-overlay)',
  border: '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  outline: 'none',
}
