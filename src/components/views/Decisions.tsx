import { useMemo, useState } from 'react'
import type { MemoryDirectory } from '../../types/memory'
import { parseDecisions } from '../../lib/parseDecisions'
import { inputStyle } from '../../styles/formStyles'

interface Props {
  directory: MemoryDirectory | null
  onWrite: (path: string, content: string) => Promise<boolean>
}

function extractTags(body: string): string[] {
  const matches = body.match(/#([a-zA-Z]\w*)/g) ?? []
  return [...new Set(matches.map(t => t.slice(1).toLowerCase()))]
}

export function Decisions({ directory, onWrite }: Props) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showDeprecated, setShowDeprecated] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [dTitle, setDTitle] = useState('')
  const [dBody, setDBody] = useState('')
  const [dError, setDError] = useState(false)

  const content = directory?.files.get('decisions.md')?.content ?? ''
  const decisions = useMemo(() => parseDecisions(content), [content])

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of decisions) {
      for (const tag of extractTags(d.body)) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [decisions])

  const deprecatedCount = useMemo(
    () => decisions.filter(d => d.status === 'deprecated').length,
    [decisions]
  )

  const filtered = useMemo(() => {
    let result = decisions
    if (!showDeprecated) result = result.filter(d => d.status !== 'deprecated')
    if (activeTag) result = result.filter(d => extractTags(d.body).includes(activeTag))
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.body.toLowerCase().includes(q)
      )
    }
    return result
  }, [decisions, search, activeTag, showDeprecated])

  const handleAdd = async () => {
    if (!dTitle.trim()) return
    setDError(false)
    const today = new Date().toISOString().slice(0, 10)
    const entry = `\n## ${today} - ${dTitle.trim()}\n${dBody.trim() || '- No additional notes.'}\n`
    const ok = await onWrite('decisions.md', content + entry)
    if (ok) {
      setDTitle('')
      setDBody('')
      setShowForm(false)
    } else {
      setDError(true)
    }
  }

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>
            Decisions
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {decisions.length} entr{decisions.length !== 1 ? 'ies' : 'y'} · decisions.md
          </div>
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
          {showForm ? '✕ Cancel' : '+ Add decision'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 20 }} className="fade-up">
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New decision</div>
          <input
            autoFocus
            placeholder="What was decided?"
            value={dTitle}
            onChange={e => setDTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && dTitle.trim()) handleAdd() }}
            style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
          />
          <textarea
            placeholder="- Chose X over Y&#10;- Reason: …&#10;Use #tags to categorize"
            value={dBody}
            onChange={e => setDBody(e.target.value)}
            rows={4}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleAdd}
              disabled={!dTitle.trim()}
              style={{
                padding: '6px 16px',
                background: dTitle.trim() ? 'var(--accent-dim)' : 'var(--bg-overlay)',
                border: `1px solid ${dTitle.trim() ? 'rgba(78,255,196,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: dTitle.trim() ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 11,
                cursor: dTitle.trim() ? 'pointer' : 'default',
              }}
            >
              Append to decisions.md
            </button>
            {dError && <span style={{ fontSize: 11, color: 'var(--red)' }}>Write failed — check directory permissions</span>}
          </div>
        </div>
      )}

      {/* Search + tag filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Search decisions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
        />
        {deprecatedCount > 0 && (
          <button
            onClick={() => setShowDeprecated(v => !v)}
            style={{
              padding: '3px 9px',
              background: !showDeprecated ? 'rgba(144,144,160,0.15)' : 'var(--bg-raised)',
              border: `1px solid ${!showDeprecated ? 'rgba(144,144,160,0.35)' : 'var(--border)'}`,
              borderRadius: 99,
              color: !showDeprecated ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {showDeprecated ? `hide deprecated (${deprecatedCount})` : `show deprecated (${deprecatedCount})`}
          </button>
        )}
        {allTags.slice(0, 8).map(([tag, count]) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            style={{
              padding: '3px 9px',
              background: activeTag === tag ? 'var(--accent-dim)' : 'var(--bg-raised)',
              border: `1px solid ${activeTag === tag ? 'rgba(78,255,196,0.3)' : 'var(--border)'}`,
              borderRadius: 99,
              color: activeTag === tag ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            #{tag} <span style={{ opacity: 0.6 }}>{count}</span>
          </button>
        ))}
      </div>

      {/* Results count when filtered */}
      {(search.trim() || activeTag) && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          {filtered.length} of {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
          {activeTag && <span> · <button onClick={() => setActiveTag(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', padding: 0 }}>clear #{activeTag}</button></span>}
        </div>
      )}

      {/* Decision cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>◎</div>
          {decisions.length === 0 ? 'No decisions logged yet' : 'No matches'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((d, i) => {
            const tags = extractTags(d.body)
            return (
              <DecisionCard key={d.slug + i} date={d.date} title={d.title} body={d.body} tags={tags} search={search} status={d.status} />
            )
          })}
        </div>
      )}
    </div>
  )
}

function DecisionCard({ date, title, body, tags, search, status }: {
  date: string
  title: string
  body: string
  tags: string[]
  search: string
  status?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const preview = body.split('\n').slice(0, 2).join(' ').slice(0, 120)

  const highlight = (text: string) => {
    if (!search.trim()) return text
    const idx = text.toLowerCase().indexOf(search.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(78,255,196,0.25)', color: 'inherit', borderRadius: 2 }}>
          {text.slice(idx, idx + search.length)}
        </mark>
        {text.slice(idx + search.length)}
      </>
    )
  }

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderLeft: `2px solid ${status === 'deprecated' ? 'var(--border-mid)' : 'var(--accent)'}`,
        borderRadius: 'var(--radius-md)',
        opacity: status === 'deprecated' ? 0.7 : 1,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{date}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: status === 'deprecated' ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1 }}>
          {highlight(title)}
        </span>
        {status === 'deprecated' && (
          <span style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border)',
            borderRadius: 99,
            padding: '1px 7px',
            flexShrink: 0,
          }}>
            deprecated
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
          {tags.map(tag => (
            <span key={tag} style={{ padding: '1px 7px', background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 99, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {!expanded && preview && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
          {highlight(preview)}{body.length > 120 ? '…' : ''}
        </div>
      )}

      {expanded && body && (
        <pre style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          marginTop: 10,
        }}>
          {body}
        </pre>
      )}
    </div>
  )
}
