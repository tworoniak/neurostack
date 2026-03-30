import { useMemo, useState } from 'react'
import type { MemoryDirectory, GotchaEntry } from '../../types/memory'
import { parseGotchas } from '../../lib/parseGotchas'
import { inputStyle } from '../../styles/formStyles'

interface Props {
  directory: MemoryDirectory | null
  onWrite: (path: string, content: string) => Promise<boolean>
}

function GotchaCard({ entry }: { entry: GotchaEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderLeft: '2px solid var(--red)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        cursor: 'pointer',
        marginBottom: 8,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--red)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: entry.affects ? 6 : 0 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 13,
          color: 'var(--text-primary)',
          flex: 1,
          lineHeight: 1.4,
        }}>
          {entry.title}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>
          {expanded ? '▴' : '▾'}
        </span>
      </div>

      {entry.affects && (
        <div style={{
          display: 'inline-block',
          fontSize: 10,
          color: 'var(--red)',
          background: 'var(--red-dim)',
          border: '1px solid rgba(255,92,92,0.2)',
          borderRadius: 99,
          padding: '1px 8px',
          fontFamily: 'var(--font-mono)',
          marginBottom: expanded ? 10 : 0,
        }}>
          {entry.affects}
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {entry.symptom && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Symptom
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {entry.symptom}
              </div>
            </div>
          )}
          {entry.fix && (
            <div style={{ marginBottom: entry.dateFound ? 10 : 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Fix
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                lineHeight: 1.6,
              }}>
                {entry.fix}
              </div>
            </div>
          )}
          {entry.dateFound && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
              found {entry.dateFound}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Gotchas({ directory, onWrite }: Props) {
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [affects, setAffects] = useState('')
  const [symptom, setSymptom] = useState('')
  const [fix, setFix] = useState('')
  const [writeError, setWriteError] = useState(false)

  const rawContent = directory?.files.get('gotchas.md')?.content ?? ''
  const entries = useMemo(() => parseGotchas(rawContent), [rawContent])

  const filtered = useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase()
    return entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.affects.toLowerCase().includes(q) ||
      e.symptom.toLowerCase().includes(q) ||
      e.fix.toLowerCase().includes(q)
    )
  }, [entries, query])

  const handleAdd = async () => {
    if (!title || !fix) return
    setWriteError(false)
    const today = new Date().toISOString().slice(0, 10)
    const block =
      `\n## ${title}\n` +
      (affects  ? `- **Affects**: ${affects}\n`   : '') +
      (symptom  ? `- **Symptom**: ${symptom}\n`   : '') +
      `- **Fix**: ${fix}\n` +
      `- **Date found**: ${today}\n`
    const ok = await onWrite('gotchas.md', rawContent + block)
    if (ok) {
      setTitle('')
      setAffects('')
      setSymptom('')
      setFix('')
      setAdding(false)
    } else {
      setWriteError(true)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search bar */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none',
          }}>
            ⚠
          </span>
          <input
            autoFocus
            placeholder="Search gotchas…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-mid)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(255,92,92,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}
            >
              ×
            </button>
          )}
        </div>
        {query && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            {filtered.length} of {entries.length} gotcha{entries.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* List + form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            {entries.length} gotcha{entries.length !== 1 ? 's' : ''} in gotchas.md
          </div>
          <button
            onClick={() => setAdding(a => !a)}
            style={{
              padding: '5px 14px',
              background: adding ? 'var(--red-dim)' : 'var(--bg-overlay)',
              border: `1px solid ${adding ? 'rgba(255,92,92,0.3)' : 'var(--border-mid)'}`,
              borderRadius: 'var(--radius-md)',
              color: adding ? 'var(--red)' : 'var(--text-secondary)',
              fontSize: 11,
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            {adding ? '✕ Cancel' : '+ Add gotcha'}
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              New gotcha
            </div>
            <input
              autoFocus
              placeholder="What broke? (title, required)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            />
            <input
              placeholder="Affects (project, file, or dependency)"
              value={affects}
              onChange={e => setAffects(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            />
            <input
              placeholder="Symptom — what you see when it breaks"
              value={symptom}
              onChange={e => setSymptom(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            />
            <textarea
              placeholder="Fix — exact steps or command (required)"
              value={fix}
              onChange={e => setFix(e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                width: '100%',
                marginBottom: 10,
                resize: 'vertical',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!title || !fix}
              style={{
                padding: '6px 16px',
                background: title && fix ? 'var(--red-dim)' : 'var(--bg-overlay)',
                border: `1px solid ${title && fix ? 'rgba(255,92,92,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: title && fix ? 'var(--red)' : 'var(--text-muted)',
                fontSize: 11,
                cursor: title && fix ? 'pointer' : 'default',
              }}
            >
              Add to gotchas.md
            </button>
            {writeError && (
              <span style={{ fontSize: 11, color: 'var(--red)', marginTop: 8, display: 'block' }}>
                Write failed — check directory permissions
              </span>
            )}
          </div>
        )}

        {/* No file warning */}
        {directory && !directory.files.has('gotchas.md') && (
          <div style={{
            padding: 16,
            background: 'var(--amber-dim)',
            border: '1px solid rgba(255,181,71,0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--amber)',
            fontSize: 12,
            marginBottom: 16,
          }}>
            ⚠ gotchas.md not found. Add it from the memory-templates folder.
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && directory?.files.has('gotchas.md') && !adding && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>⚠</div>
            No gotchas yet. Add one the moment you hit a bug.
          </div>
        )}

        {/* No results */}
        {query && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
            No matches for "{query}"
          </div>
        )}

        {/* Gotcha cards */}
        {filtered.map(entry => (
          <GotchaCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
