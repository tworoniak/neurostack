import { useState } from 'react'

interface Props {
  onOpen: () => void
  onBootstrap: (projectName: string) => void
  loading: boolean
  restoring: boolean
  error: string | null
}

export function Landing({ onOpen, onBootstrap, loading, restoring, error }: Props) {
  const [bootstrapping, setBootstrapping] = useState(false)
  const [projectName, setProjectName] = useState('')

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      gap: 0,
    }}>
      {/* Logo mark */}
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 24, opacity: 0.9 }}>
        <circle cx="16" cy="16" r="6" stroke="#4EFFC4" strokeWidth="1.2"/>
        <circle cx="16" cy="16" r="2.5" fill="#4EFFC4"/>
        <line x1="16" y1="2" x2="16" y2="9" stroke="#4EFFC4" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="16" y1="23" x2="16" y2="30" stroke="#4EFFC4" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="2" y1="16" x2="9" y2="16" stroke="#4EFFC4" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="23" y1="16" x2="30" y2="16" stroke="#4EFFC4" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="6.3" y1="6.3" x2="11" y2="11" stroke="#4EFFC4" strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
        <line x1="21" y1="21" x2="25.7" y2="25.7" stroke="#4EFFC4" strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
        <line x1="25.7" y1="6.3" x2="21" y2="11" stroke="#4EFFC4" strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
        <line x1="11" y1="21" x2="6.3" y2="25.7" stroke="#4EFFC4" strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
      </svg>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 28,
        letterSpacing: '0.1em',
        color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        NEURO<span style={{ color: 'var(--accent)' }}>STACK</span>
      </h1>

      <p style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
        marginBottom: 48,
        textAlign: 'center',
        maxWidth: 340,
        lineHeight: 1.7,
      }}>
        Self-managing memory dashboard for Claude Code.<br/>
        Connect your memory directory to begin.
      </p>

      {/* Feature grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 48,
        width: '100%',
        maxWidth: 420,
      }}>
        {[
          { icon: '⬡', label: 'File Editor',    desc: 'Read & edit all memory files' },
          { icon: '◈', label: 'Agent Tracker',  desc: 'Kanban board from active-work.md' },
          { icon: '◎', label: 'Timeline',        desc: 'Decisions log & session history' },
          { icon: '⊹', label: 'Global Search',   desc: 'Fuzzy search across all files' },
        ].map(f => (
          <div key={f.label} style={{
            padding: '14px 16px',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: 16, marginBottom: 6, color: 'var(--accent)', opacity: 0.7 }}>{f.icon}</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 3 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onOpen}
        disabled={loading || restoring}
        style={{
          padding: '12px 32px',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(78,255,196,0.35)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: loading || restoring ? 'default' : 'pointer',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {restoring ? (
          <>
            <span className="pulse-dot" style={{ background: 'var(--accent)' }} />
            Restoring session…
          </>
        ) : loading ? (
          <>
            <span className="pulse-dot" style={{ background: 'var(--accent)' }} />
            Opening…
          </>
        ) : (
          '+ Open memory directory'
        )}
      </button>

      {/* Bootstrap new project */}
      {bootstrapping ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <input
            autoFocus
            placeholder="Project name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && projectName.trim()) onBootstrap(projectName.trim())
              if (e.key === 'Escape') { setBootstrapping(false); setProjectName('') }
            }}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-mid)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              width: 180,
            }}
          />
          <button
            onClick={() => { if (projectName.trim()) onBootstrap(projectName.trim()) }}
            disabled={!projectName.trim()}
            style={{
              padding: '8px 16px',
              background: projectName.trim() ? 'var(--accent-dim)' : 'var(--bg-overlay)',
              border: `1px solid ${projectName.trim() ? 'rgba(78,255,196,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              color: projectName.trim() ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              cursor: projectName.trim() ? 'pointer' : 'default',
            }}
          >
            Create
          </button>
          <button
            onClick={() => { setBootstrapping(false); setProjectName('') }}
            style={{ padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setBootstrapping(true)}
          disabled={loading || restoring}
          style={{
            marginTop: 10,
            padding: '8px 24px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          ✦ New project
        </button>
      )}

      {error && (
        <div style={{
          marginTop: 16,
          padding: '8px 16px',
          background: 'var(--red-dim)',
          border: '1px solid rgba(255,92,92,0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--red)',
          fontSize: 11,
        }}>
          {error}
        </div>
      )}

      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 24, opacity: 0.5, letterSpacing: '0.04em' }}>
        uses File System Access API · no data leaves your machine
      </p>
    </div>
  )
}
