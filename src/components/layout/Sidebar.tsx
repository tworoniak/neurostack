import type { ViewId } from '../../types/memory'
import type { MemoryDirectory } from '../../types/memory'

interface Props {
  activeView: ViewId
  onViewChange: (v: ViewId) => void
  directory: MemoryDirectory | null
  onOpen: () => void
}

const NAV: { id: ViewId; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',  icon: '◉' },
  { id: 'editor',    label: 'Files',     icon: '⬡' },
  { id: 'agents',    label: 'Agents',    icon: '◈' },
  { id: 'projects',  label: 'Projects',  icon: '▣' },
  { id: 'timeline',  label: 'Timeline',  icon: '◎' },
  { id: 'gotchas',   label: 'Gotchas',   icon: '⚠' },
  { id: 'infra',     label: 'Infra',     icon: '⌗' },
  { id: 'metrics',   label: 'Metrics',   icon: '◫' },
  { id: 'search',    label: 'Search',    icon: '⊹' },
]

export function Sidebar({ activeView, onViewChange, directory, onOpen }: Props) {
  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
    }}>
      {/* Logo */}
      <div style={{
        height: 'var(--topbar-h)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid var(--border)',
        gap: 10,
      }}>
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="5" stroke="#4EFFC4" strokeWidth="1.5"/>
          <circle cx="16" cy="16" r="2" fill="#4EFFC4"/>
          <line x1="16" y1="4" x2="16" y2="10" stroke="#4EFFC4" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="16" y1="22" x2="16" y2="28" stroke="#4EFFC4" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="4" y1="16" x2="10" y2="16" stroke="#4EFFC4" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="22" y1="16" x2="28" y2="16" stroke="#4EFFC4" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: '0.06em',
          color: 'var(--text-primary)',
        }}>
          NEURO<span style={{ color: 'var(--accent)' }}>STACK</span>
        </span>
      </div>

      {/* Open button */}
      <div style={{ padding: '16px 14px 8px' }}>
        <button
          onClick={onOpen}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: directory ? 'var(--accent-dim)' : 'var(--bg-overlay)',
            border: `1px solid ${directory ? 'rgba(78,255,196,0.25)' : 'var(--border-mid)'}`,
            borderRadius: 'var(--radius-md)',
            color: directory ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          {directory ? (
            <>
              <span className="pulse-dot" style={{ background: 'var(--accent)' }} />
              Connected
            </>
          ) : (
            <>
              <span style={{ fontSize: 12 }}>+</span>
              Open directory
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const active = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: active ? 'var(--accent-dim)' : 'transparent',
                border: active ? '1px solid rgba(78,255,196,0.15)' : '1px solid transparent',
                borderRadius: 'var(--radius-md)',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                letterSpacing: '0.02em',
                transition: 'all 0.12s',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, opacity: 0.9 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      {directory && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: 10,
          letterSpacing: '0.05em',
        }}>
          <div style={{ marginBottom: 2 }}>{directory.files.size} files loaded</div>
          <div style={{ color: 'var(--text-muted)', opacity: 0.6 }}>watching · 4s interval</div>
        </div>
      )}
    </aside>
  )
}
