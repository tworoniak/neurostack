import { useMemo, useState } from 'react'
import type { MemoryDirectory } from '../../types/memory'
import { parseMetrics, type MetricSection } from '../../lib/parseMetrics'

const TEMPLATE = `# Live Metrics

> Updated by Claude agents or manually. NeuroStack renders each value as a counter widget.
> Format: - **Key**: value  (under ## section headings)
> Percent values (e.g. 68%) render a fill bar. Numeric values render large.

## ${new Date().getFullYear()} — Project Name
- **Sessions**: 0
- **Decisions Made**: 0
- **Files Modified**: 0
- **Completion**: 0%
`

interface Props {
  directory: MemoryDirectory | null
  onWrite: (path: string, content: string) => Promise<boolean>
}

function MetricCard({ entry }: { entry: { key: string; value: string; numericValue: number | null } }) {
  const isNumeric = entry.numericValue !== null
  const isPercent = entry.value.trim().endsWith('%')

  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        fontFamily: 'var(--font-display)',
      }}>
        {entry.key}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: isNumeric ? 28 : 16,
          fontFamily: isNumeric ? 'var(--font-display)' : 'var(--font-mono)',
          fontWeight: 700,
          color: 'var(--accent)',
          lineHeight: 1,
          letterSpacing: isNumeric ? '-0.02em' : '0',
        }}>
          {isNumeric ? entry.numericValue!.toLocaleString() : entry.value}
        </span>
        {isPercent && (
          <span style={{ fontSize: 14, color: 'var(--accent)', opacity: 0.7, fontFamily: 'var(--font-display)' }}>%</span>
        )}
      </div>
      {isNumeric && !isPercent && (
        <div style={{
          height: 2,
          background: 'var(--bg-overlay)',
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: '100%',
            background: 'var(--accent)',
            opacity: 0.25,
            borderRadius: 99,
          }} />
        </div>
      )}
      {isPercent && (
        <div style={{ height: 2, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(entry.numericValue ?? 0, 100)}%`,
            background: 'var(--accent)',
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}
    </div>
  )
}

function SectionBlock({ section }: { section: MetricSection }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 13,
        color: 'var(--text-primary)',
        letterSpacing: '0.03em',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid var(--border)',
      }}>
        {section.heading}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 10,
      }}>
        {section.metrics.map(m => (
          <MetricCard key={m.key} entry={m} />
        ))}
      </div>
    </div>
  )
}

export function MetricsView({ directory, onWrite }: Props) {
  const metricsFile = directory?.files.get('live-metrics.md')
  const sections = useMemo(
    () => metricsFile ? parseMetrics(metricsFile.content) : [],
    [metricsFile]
  )
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(false)

  const totalMetrics = sections.reduce((n, s) => n + s.metrics.length, 0)

  const handleCreate = async () => {
    setCreating(true)
    setCreateError(false)
    const ok = await onWrite('live-metrics.md', TEMPLATE)
    setCreating(false)
    if (!ok) setCreateError(true)
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>
          Metrics
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {metricsFile
            ? `${totalMetrics} metric${totalMetrics !== 1 ? 's' : ''} · reads live-metrics.md`
            : 'reads live-metrics.md · file not found'}
        </div>
      </div>

      {/* No file — create prompt */}
      {!metricsFile && (
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
              No live-metrics.md found
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              Create the file to start tracking project KPIs as counter widgets.
              Claude agents can update values directly on disk — NeuroStack re-reads every 4s.
            </p>
          </div>

          {/* Format reference */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Format
            </div>
            <pre style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              margin: 0,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>{`## Section name
- **Metric name**: 42
- **Completion**: 68%
- **Status**: on track`}</pre>
          </div>

          {/* Agent snippet */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Agent update pattern
            </div>
            <pre style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              margin: 0,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>{`# In CLAUDE.md or as a protocol step:
Read live-metrics.md, update the relevant
- **Key**: value line, and write the file back.
NeuroStack will pick up the change within 4s.`}</pre>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                padding: '8px 20px',
                background: 'var(--accent-dim)',
                border: '1px solid rgba(78,255,196,0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                cursor: creating ? 'default' : 'pointer',
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? 'Creating…' : '+ Create live-metrics.md'}
            </button>
            {createError && (
              <span style={{ fontSize: 11, color: 'var(--red)' }}>Write failed — check directory permissions</span>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      {sections.map(s => <SectionBlock key={s.heading} section={s} />)}

      {metricsFile && sections.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No metrics found. Use <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>- **Key**: value</code> pairs under <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>##</code> headings.
        </div>
      )}
    </div>
  )
}
