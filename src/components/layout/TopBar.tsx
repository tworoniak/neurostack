import { useState, useRef, useEffect } from 'react'
import type { ViewId } from '../../types/memory'

const TITLES: Record<ViewId, { label: string; description: string }> = {
  overview:  { label: 'Overview',        description: 'Project health and activity at a glance' },
  editor:    { label: 'File Editor',     description: 'Read and edit memory files directly' },
  agents:    { label: 'Agent Tracker',   description: 'Live multi-agent coordination board' },
  timeline:  { label: 'Timeline',        description: 'Session history and decisions log' },
  decisions: { label: 'Decisions',       description: 'Searchable architecture decisions with tag filtering' },
  gotchas:   { label: 'Gotchas',         description: 'Known bugs and workarounds — check before debugging' },
  activity:  { label: 'Activity Feed',   description: 'File changes detected by the poller this session' },
  projects:  { label: 'Projects',        description: 'Status board across all projects' },
  infra:     { label: 'Infrastructure',  description: 'Ports, services, and environment variable references' },
  metrics:   { label: 'Metrics',         description: 'Live counters and KPIs from live-metrics.md' },
  search:    { label: 'Search',          description: 'Full-text search across all memory files' },
}

const INTERVALS = [
  { label: '2s',     ms: 2000 },
  { label: '4s',     ms: 4000 },
  { label: '10s',    ms: 10000 },
  { label: '30s',    ms: 30000 },
  { label: 'manual', ms: 0 },
]

interface Props {
  activeView: ViewId
  onRefresh: () => void
  lastRefreshed: Date | null
  refreshing: boolean
  refreshInterval: number
  onIntervalChange: (ms: number) => void
}

export function TopBar({ activeView, onRefresh, lastRefreshed, refreshing, refreshInterval, onIntervalChange }: Props) {
  const { label, description } = TITLES[activeView]
  const [popoverOpen, setPopoverOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popoverOpen) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [popoverOpen])

  const currentLabel = INTERVALS.find(i => i.ms === refreshInterval)?.label ?? `${refreshInterval / 1000}s`

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

      {/* Interval selector */}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setPopoverOpen(o => !o)}
          title="Change refresh interval"
          style={{
            padding: '0 8px',
            height: 30,
            background: popoverOpen ? 'var(--bg-overlay)' : 'transparent',
            border: `1px solid ${popoverOpen ? 'var(--border-mid)' : 'transparent'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {currentLabel} <span style={{ opacity: 0.5, fontSize: 8 }}>▾</span>
        </button>
        {popoverOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            zIndex: 100,
            minWidth: 90,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            {INTERVALS.map(({ label: iLabel, ms }, idx) => (
              <button
                key={ms}
                onClick={() => { onIntervalChange(ms); setPopoverOpen(false) }}
                style={{
                  width: '100%',
                  padding: '7px 14px',
                  background: refreshInterval === ms ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  borderBottom: idx < INTERVALS.length - 1 ? '1px solid var(--border)' : 'none',
                  color: refreshInterval === ms ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {iLabel}
              </button>
            ))}
          </div>
        )}
      </div>

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
