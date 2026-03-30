import type { ViewId } from '../../types/memory'

const TITLES: Record<ViewId, { label: string; description: string }> = {
  overview: { label: 'Overview',        description: 'Project health and activity at a glance' },
  editor:   { label: 'File Editor',     description: 'Read and edit memory files directly' },
  agents:   { label: 'Agent Tracker',   description: 'Live multi-agent coordination board' },
  timeline: { label: 'Timeline',        description: 'Decisions log and session history' },
  gotchas:  { label: 'Gotchas',         description: 'Known bugs and workarounds — check before debugging' },
  search:   { label: 'Search',          description: 'Full-text search across all memory files' },
}

interface Props {
  activeView: ViewId
  onRefresh: () => void
  lastRefreshed: Date | null
  refreshing: boolean
}

export function TopBar({ activeView, onRefresh, lastRefreshed, refreshing }: Props) {
  const { label, description } = TITLES[activeView]

  return (
    <header style={{
      height: 'var(--topbar-h)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      background: 'var(--bg-surface)',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '0.04em',
          color: 'var(--text-primary)',
        }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {description}
        </div>
      </div>

      {refreshing && (
        <span style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.04em', opacity: 0.7 }}>
          refreshing…
        </span>
      )}
      {!refreshing && lastRefreshed && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}

      <button
        onClick={onRefresh}
        disabled={refreshing}
        title="Refresh all files (⌘⇧R)"
        style={{
          width: 30,
          height: 30,
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-md)',
          color: refreshing ? 'var(--text-muted)' : 'var(--text-secondary)',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.12s',
          cursor: refreshing ? 'default' : 'pointer',
        }}
      >
        ↻
      </button>
    </header>
  )
}
