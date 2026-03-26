import { useState } from 'react'
import type { MemoryDirectory } from '../../types/memory'
import { useSearch } from '../../hooks/useSearch'

interface Props {
  directory: MemoryDirectory | null
  onSelectFile: (path: string) => void
}

export function Search({ directory, onSelectFile }: Props) {
  const [query, setQuery] = useState('')
  const results = useSearch(directory, query)

  // Group by file path
  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    if (!acc[r.path]) acc[r.path] = []
    acc[r.path].push(r)
    return acc
  }, {})

  const fileCount = Object.keys(grouped).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search input */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: 14,
            pointerEvents: 'none',
          }}>
            ⊹
          </span>
          <input
            autoFocus
            placeholder="Search across all memory files…"
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
            onFocus={e => (e.target.style.borderColor = 'rgba(78,255,196,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 16,
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          )}
        </div>

        {query && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
            {results.length} match{results.length !== 1 ? 'es' : ''} across {fileCount} file{fileCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {!directory && (
          <EmptyState icon="⊹" message="Open a memory directory to begin searching" />
        )}

        {directory && !query && (
          <div style={{ padding: '40px 0' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Loaded files
            </div>
            {[...directory.files.values()]
              .sort((a, b) => a.path.localeCompare(b.path))
              .map(file => (
                <button
                  key={file.path}
                  onClick={() => onSelectFile(file.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 12px',
                    marginBottom: 4,
                    background: 'transparent',
                    border: '1px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    fontFamily: 'var(--font-mono)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--bg-raised)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  <span style={{ color: 'var(--accent)', opacity: 0.5 }}>⬡</span>
                  <span style={{ flex: 1 }}>{file.path}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                    {file.content.split('\n').length} lines
                  </span>
                </button>
              ))}
          </div>
        )}

        {query && results.length === 0 && (
          <EmptyState icon="⊹" message={`No matches found for "${query}"`} />
        )}

        {query && Object.entries(grouped).map(([path, matches]) => (
          <div key={path} style={{ marginBottom: 24 }} className="fade-up">
            {/* File header */}
            <button
              onClick={() => onSelectFile(path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <span style={{ color: 'var(--accent)', fontSize: 12 }}>⬡</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 12,
                color: 'var(--accent)',
                letterSpacing: '0.03em',
              }}>
                {path}
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: 'var(--text-muted)',
                background: 'var(--accent-dim)',
                padding: '1px 7px',
                borderRadius: 99,
                color: 'var(--accent)',
              }}>
                {matches.length}
              </span>
            </button>

            {/* Match lines */}
            {matches.slice(0, 5).map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 4,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, minWidth: 28, textAlign: 'right' }}>
                  {r.lineNumber}
                </span>
                <span style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {highlight(r.matchedLine, query)}
                </span>
              </div>
            ))}

            {matches.length > 5 && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 12px' }}>
                +{matches.length - 5} more matches
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 2, padding: '0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 12 }}>
      <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>{icon}</div>
      {message}
    </div>
  )
}
