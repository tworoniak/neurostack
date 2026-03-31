import { useState } from 'react'
import type { MemoryDirectory } from '../../types/memory'

interface Props {
  directory: MemoryDirectory | null
}

interface TableSection {
  heading: string
  headers: string[]
  rows: string[][]
}

interface ListSection {
  heading: string
  items: string[]
}

type Section = { type: 'table'; data: TableSection } | { type: 'list'; data: ListSection }

function parseSections(content: string): Section[] {
  const sections: Section[] = []
  const blocks = content.split(/^##\s+/m).slice(1)

  for (const block of blocks) {
    const lines = block.split('\n')
    const heading = lines[0].trim()
    const body = lines.slice(1)

    // Check if block contains a markdown table
    const tableStart = body.findIndex(l => l.trim().startsWith('|'))
    if (tableStart !== -1) {
      const tableLines = body.slice(tableStart).filter(l => l.trim().startsWith('|'))
      if (tableLines.length >= 2) {
        const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean)
        const rows = tableLines
          .slice(2) // skip separator row
          .map(l => l.split('|').map(c => c.trim()).filter(Boolean))
          .filter(r => r.length > 0 && r.some(c => c && c !== ''))
        sections.push({ type: 'table', data: { heading, headers, rows } })
        continue
      }
    }

    // Otherwise treat as a bullet list
    const items = body
      .filter(l => l.trim().match(/^[-*]/))
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)

    if (items.length > 0) {
      sections.push({ type: 'list', data: { heading, items } })
    }
  }

  return sections
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        padding: '1px 7px',
        background: copied ? 'var(--accent-dim)' : 'var(--bg-overlay)',
        border: `1px solid ${copied ? 'rgba(78,255,196,0.3)' : 'var(--border)'}`,
        borderRadius: 4,
        color: copied ? 'var(--accent)' : 'var(--text-muted)',
        fontSize: 9,
        cursor: 'pointer',
        letterSpacing: '0.04em',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {copied ? '✓' : 'copy'}
    </button>
  )
}

function TableSectionCard({ section }: { section: TableSection }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 13,
        color: 'var(--text-primary)',
        letterSpacing: '0.03em',
        marginBottom: 10,
      }}>
        {section.heading}
      </div>
      <div style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${section.headers.length}, 1fr)`,
          background: 'var(--bg-overlay)',
          borderBottom: '1px solid var(--border)',
          padding: '7px 14px',
        }}>
          {section.headers.map(h => (
            <span key={h} style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontFamily: 'var(--font-display)',
            }}>
              {h}
            </span>
          ))}
        </div>
        {/* Data rows */}
        {section.rows.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${section.headers.length}, 1fr)`,
              padding: '8px 14px',
              borderBottom: ri < section.rows.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
            }}
          >
            {row.map((cell, ci) => (
              <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 11,
                  color: ci === 0 ? 'var(--text-primary)' : 'var(--accent)',
                  fontFamily: ci > 0 ? 'var(--font-mono)' : undefined,
                }}>
                  {cell || '—'}
                </span>
                {ci > 0 && cell && cell !== '—' && <CopyButton value={cell} />}
              </div>
            ))}
          </div>
        ))}
        {section.rows.length === 0 && (
          <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No entries
          </div>
        )}
      </div>
    </div>
  )
}

function ListSectionCard({ section }: { section: ListSection }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 13,
        color: 'var(--text-primary)',
        letterSpacing: '0.03em',
        marginBottom: 10,
      }}>
        {section.heading}
      </div>
      <div style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        {section.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 14px',
              borderBottom: i < section.items.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, lineHeight: 1.5 }}>
              {item}
            </span>
            <CopyButton value={item} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function InfraView({ directory }: Props) {
  const infraFile = directory?.files.get('infra.md')
  const sections = infraFile ? parseSections(infraFile.content) : []

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>
          Infrastructure
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Read-only · reads infra.md
        </div>
      </div>

      {/* No file */}
      {!infraFile && (
        <div style={{
          padding: '16px',
          background: 'var(--amber-dim)',
          border: '1px solid rgba(255,181,71,0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--amber)',
          fontSize: 12,
        }}>
          ⚠ infra.md not found. Add it from the memory-templates folder.
        </div>
      )}

      {/* Sections */}
      {sections.map((section, i) =>
        section.type === 'table'
          ? <TableSectionCard key={i} section={section.data} />
          : <ListSectionCard key={i} section={section.data} />
      )}

      {infraFile && sections.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No structured sections found in infra.md
        </div>
      )}
    </div>
  )
}
