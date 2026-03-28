import { useMemo, useState, useEffect } from 'react'
import type { MemoryDirectory } from '../../types/memory'
import { parseDecisions } from '../../lib/parseDecisions'
import { parseWorklog } from '../../lib/parseWorklog'
import { inputStyle } from '../../styles/formStyles'

interface Props {
  directory: MemoryDirectory | null
  onWrite: (path: string, content: string) => Promise<boolean>
}

type Tab = 'decisions' | 'worklog'

export function Timeline({ directory, onWrite }: Props) {
  const [tab, setTab] = useState<Tab>('decisions')
  const [showForm, setShowForm] = useState(false)

  // Decision form state
  const [dTitle, setDTitle] = useState('')
  const [dBody, setDBody] = useState('')
  const [dError, setDError] = useState(false)

  // Worklog form state
  const [wProject, setWProject] = useState('')
  const [wSummary, setWSummary] = useState('')
  const [wError, setWError] = useState(false)

  useEffect(() => {
    setDTitle(''); setDBody(''); setDError(false)
    setWProject(''); setWSummary(''); setWError(false)
  }, [tab])

  const decisionsContent = directory?.files.get('decisions.md')?.content ?? ''
  const worklogContent   = directory?.files.get('worklog.md')?.content ?? ''

  const decisions = useMemo(() => parseDecisions(decisionsContent), [decisionsContent])
  const worklogs  = useMemo(() => parseWorklog(worklogContent), [worklogContent])

  const handleAddDecision = async () => {
    if (!dTitle) return
    setDError(false)
    const today = new Date().toISOString().slice(0, 10)
    const entry = `\n## ${today} - ${dTitle}\n${dBody || '- No additional notes.'}\n`
    const ok = await onWrite('decisions.md', decisionsContent + entry)
    if (ok) {
      setDTitle('')
      setDBody('')
      setShowForm(false)
    } else {
      setDError(true)
    }
  }

  const handleAddWorklog = async () => {
    if (!wProject || !wSummary) return
    setWError(false)
    const today = new Date().toISOString().slice(0, 10)
    const entry = `\n## ${today} [${wProject}]\n- ${wSummary}\n`
    const ok = await onWrite('worklog.md', worklogContent + entry)
    if (ok) {
      setWProject('')
      setWSummary('')
      setShowForm(false)
    } else {
      setWError(true)
    }
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['decisions', 'worklog'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setShowForm(false) }}
              style={{
                padding: '6px 16px',
                background: tab === t ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${tab === t ? 'rgba(78,255,196,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 11,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {t === 'decisions' ? `Decisions (${decisions.length})` : `Worklog (${worklogs.length})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          style={{
            padding: '6px 14px',
            background: showForm ? 'var(--accent-dim)' : 'var(--bg-overlay)',
            border: `1px solid ${showForm ? 'rgba(78,255,196,0.3)' : 'var(--border-mid)'}`,
            borderRadius: 'var(--radius-md)',
            color: showForm ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 11,
            letterSpacing: '0.05em',
            cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Cancel' : `+ Add ${tab === 'decisions' ? 'decision' : 'session'}`}
        </button>
      </div>

      {/* Add form */}
      {showForm && tab === 'decisions' && (
        <div style={formCard} className="fade-up">
          <div style={formLabel}>New decision</div>
          <input
            placeholder="What was decided?"
            value={dTitle}
            onChange={e => setDTitle(e.target.value)}
            style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
          />
          <textarea
            placeholder="- Chose X over Y&#10;- Reason: …&#10;- Constraints: …"
            value={dBody}
            onChange={e => setDBody(e.target.value)}
            rows={4}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={handleAddDecision} disabled={!dTitle} style={submitBtn(!!dTitle)}>
              Append to decisions.md
            </button>
            {dError && <span style={{ fontSize: 11, color: 'var(--red)' }}>Write failed — check directory permissions</span>}
          </div>
        </div>
      )}

      {showForm && tab === 'worklog' && (
        <div style={formCard} className="fade-up">
          <div style={formLabel}>New session entry</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              placeholder="project-name"
              value={wProject}
              onChange={e => setWProject(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="What was accomplished?"
              value={wSummary}
              onChange={e => setWSummary(e.target.value)}
              style={{ ...inputStyle, flex: 2 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={handleAddWorklog} disabled={!wProject || !wSummary} style={submitBtn(!!(wProject && wSummary))}>
              Append to worklog.md
            </button>
            {wError && <span style={{ fontSize: 11, color: 'var(--red)' }}>Write failed — check directory permissions</span>}
          </div>
        </div>
      )}

      {/* Decisions feed */}
      {tab === 'decisions' && (
        <div>
          {decisions.length === 0 ? (
            <EmptyState icon="◎" message="No decisions logged yet" />
          ) : (
            decisions.map((d, i) => (
              <div
                key={d.slug + i}
                className="fade-up"
                style={{
                  display: 'flex',
                  gap: 20,
                  marginBottom: 24,
                  animationDelay: `${i * 30}ms`,
                }}
              >
                {/* Date column */}
                <div style={{ width: 90, flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    {d.date}
                  </div>
                </div>

                {/* Timeline line + dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 3 }} />
                  <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 6 }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingBottom: 24 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                    letterSpacing: '0.02em',
                  }}>
                    {d.title}
                  </div>
                  {d.body && (
                    <pre style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                    }}>
                      {d.body}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Worklog feed */}
      {tab === 'worklog' && (
        <div>
          {worklogs.length === 0 ? (
            <EmptyState icon="◎" message="No sessions logged yet" />
          ) : (
            worklogs.map((w, i) => (
              <div
                key={`${w.date}-${i}`}
                className="fade-up"
                style={{
                  display: 'flex',
                  gap: 20,
                  marginBottom: 20,
                  animationDelay: `${i * 30}ms`,
                }}
              >
                <div style={{ width: 90, flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.05em' }}>{w.date}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: 3 }} />
                  <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 6 }} />
                </div>

                <div style={{ flex: 1, paddingBottom: 20 }}>
                  <span className="badge badge-amber" style={{ marginBottom: 6, display: 'inline-flex' }}>
                    {w.project}
                  </span>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {w.summary}
                  </div>
                  {w.details && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {w.details}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 12 }}>
      <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>{icon}</div>
      {message}
    </div>
  )
}

const formCard: React.CSSProperties = {
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  marginBottom: 24,
}

const formLabel: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-muted)',
  marginBottom: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}


const submitBtn = (enabled: boolean): React.CSSProperties => ({
  padding: '6px 16px',
  background: enabled ? 'var(--accent-dim)' : 'var(--bg-overlay)',
  border: `1px solid ${enabled ? 'rgba(78,255,196,0.3)' : 'var(--border)'}`,
  borderRadius: 'var(--radius-sm)',
  color: enabled ? 'var(--accent)' : 'var(--text-muted)',
  fontSize: 11,
  cursor: enabled ? 'pointer' : 'default',
  fontFamily: 'var(--font-mono)',
})
