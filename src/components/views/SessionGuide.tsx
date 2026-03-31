import { useState } from 'react'

interface Props {
  onNavigateToFile: (path: string) => void
  onDismiss: () => void
}

const STEPS: { label: string; file: string; desc: string }[] = [
  { label: 'MEMORY.md',       file: 'MEMORY.md',       desc: 'Routing index — tells you what files to load next' },
  { label: 'active-work.md',  file: 'active-work.md',  desc: 'What other agents are doing right now — avoid their files' },
  { label: 'projects/<name>.md', file: 'projects/',    desc: 'Current state of the project you\'re working on' },
  { label: 'gotchas.md',      file: 'gotchas.md',      desc: 'Known bugs and workarounds — check before debugging' },
]

export function SessionGuide({ onNavigateToFile, onDismiss }: Props) {
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  const handleStep = (index: number, file: string) => {
    // For the projects step, just mark as visited — the user navigates manually
    if (!file.endsWith('/')) {
      onNavigateToFile(file)
    }
    setCompleted(prev => new Set(prev).add(index))
  }

  const allDone = completed.size === STEPS.length

  return (
    <div style={{
      margin: '16px 24px 0',
      background: 'var(--bg-raised)',
      border: '1px solid rgba(78,255,196,0.2)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--accent-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--accent)', fontSize: 13 }}>◉</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 12,
            color: 'var(--accent)',
            letterSpacing: '0.05em',
          }}>
            Session Start Protocol
          </span>
          <span style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            padding: '1px 7px',
            background: 'var(--bg-overlay)',
            borderRadius: 99,
          }}>
            {completed.size}/{STEPS.length} read
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 14,
            cursor: 'pointer',
            lineHeight: 1,
            padding: '2px 4px',
          }}
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Steps */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STEPS.map((step, i) => {
          const done = completed.has(i)
          return (
            <div
              key={step.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: done ? 'rgba(78,255,196,0.05)' : 'var(--bg-overlay)',
                border: `1px solid ${done ? 'rgba(78,255,196,0.15)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.15s',
              }}
            >
              {/* Step number / checkmark */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: done ? 'var(--accent-dim)' : 'var(--bg-raised)',
                border: `1px solid ${done ? 'rgba(78,255,196,0.4)' : 'var(--border-mid)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 10,
                color: done ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                {done ? '✓' : i + 1}
              </div>

              {/* Label + desc */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: done ? 'var(--text-muted)' : 'var(--accent)',
                  textDecoration: done ? 'line-through' : 'none',
                  opacity: done ? 0.6 : 1,
                }}>
                  {step.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                  — {step.desc}
                </span>
              </div>

              {/* Open button */}
              {!step.file.endsWith('/') && (
                <button
                  onClick={() => handleStep(i, step.file)}
                  style={{
                    padding: '3px 10px',
                    background: done ? 'var(--bg-raised)' : 'var(--accent-dim)',
                    border: `1px solid ${done ? 'var(--border)' : 'rgba(78,255,196,0.3)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: done ? 'var(--text-muted)' : 'var(--accent)',
                    fontSize: 10,
                    cursor: 'pointer',
                    flexShrink: 0,
                    letterSpacing: '0.04em',
                  }}
                >
                  {done ? 'revisit' : 'open →'}
                </button>
              )}
              {step.file.endsWith('/') && (
                <button
                  onClick={() => setCompleted(prev => new Set(prev).add(i))}
                  style={{
                    padding: '3px 10px',
                    background: done ? 'var(--bg-raised)' : 'var(--accent-dim)',
                    border: `1px solid ${done ? 'var(--border)' : 'rgba(78,255,196,0.3)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: done ? 'var(--text-muted)' : 'var(--accent)',
                    fontSize: 10,
                    cursor: 'pointer',
                    flexShrink: 0,
                    letterSpacing: '0.04em',
                  }}
                >
                  {done ? '✓ done' : 'mark read'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>
          This guide shows once per browser session
        </span>
        <button
          onClick={onDismiss}
          style={{
            padding: '4px 14px',
            background: allDone ? 'var(--accent-dim)' : 'var(--bg-overlay)',
            border: `1px solid ${allDone ? 'rgba(78,255,196,0.3)' : 'var(--border-mid)'}`,
            borderRadius: 'var(--radius-sm)',
            color: allDone ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 10,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          {allDone ? '✓ Start working' : 'Skip guide'}
        </button>
      </div>
    </div>
  )
}
