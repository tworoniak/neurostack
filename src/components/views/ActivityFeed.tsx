import { useEffect, useState } from 'react'
import type { ActivityEvent } from '../../types/memory'

interface Props {
  activityLog: ActivityEvent[]
  onSelectFile?: (path: string) => void
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ActivityFeed({ activityLog, onSelectFile }: Props) {
  // Tick every 30s to keep relative timestamps fresh
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const events = [...activityLog].reverse()
  const atCap = activityLog.length >= 200

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>
          Activity Feed
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {events.length} event{events.length !== 1 ? 's' : ''} this session
          {atCap && <span style={{ color: 'var(--amber)', marginLeft: 6 }}>· ring buffer full (200)</span>}
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>◎</div>
          No file changes detected yet. Changes appear here as the poller runs every 4s.
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {events.map((ev, i) => {
            const delta = ev.newLines - ev.prevLines
            const deltaStr = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '±0'
            const deltaColor = delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--red)' : 'var(--text-muted)'
            const name = ev.path.split('/').at(-1)!
            const folder = ev.path.includes('/') ? ev.path.split('/').slice(0, -1).join('/') + '/' : ''
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '9px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {/* Time */}
                <span style={{ width: 64, flexShrink: 0, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  {formatTime(ev.timestamp)}
                </span>

                {/* File path — clickable if handler provided */}
                {onSelectFile ? (
                  <button
                    onClick={() => onSelectFile(ev.path)}
                    title="Open in FileEditor"
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {folder && <span style={{ opacity: 0.45 }}>{folder}</span>}
                    <span>{name}</span>
                  </button>
                ) : (
                  <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {folder && <span style={{ opacity: 0.45 }}>{folder}</span>}
                    <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                  </span>
                )}

                {/* Line counts */}
                <span style={{ width: 80, flexShrink: 0, textAlign: 'right', fontSize: 10, color: 'var(--text-muted)' }}>
                  {ev.prevLines}→{ev.newLines}L
                </span>

                {/* Delta */}
                <span style={{ width: 36, flexShrink: 0, textAlign: 'right', fontWeight: 600, color: deltaColor }}>
                  {deltaStr}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
