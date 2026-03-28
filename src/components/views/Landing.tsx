interface Props {
  onOpen: () => void
  loading: boolean
  restoring: boolean
  error: string | null
}

export function Landing({ onOpen, loading, restoring, error }: Props) {
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
