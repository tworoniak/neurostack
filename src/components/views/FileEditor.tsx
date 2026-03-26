import { useState, useEffect } from 'react'
import type { MemoryDirectory } from '../../types/memory'

interface Props {
  directory: MemoryDirectory | null
  onWrite: (path: string, content: string) => Promise<boolean>
  jumpToPath?: string
  onJumped?: () => void
}

function FileTree({
  files,
  selected,
  onSelect,
}: {
  files: Map<string, { name: string; path: string; lastModified: number }>
  selected: string | null
  onSelect: (path: string) => void
}) {
  const grouped = new Map<string, string[]>()
  for (const path of files.keys()) {
    const parts = path.split('/')
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '__root__'
    if (!grouped.has(folder)) grouped.set(folder, [])
    grouped.get(folder)!.push(path)
  }

  const sorted = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === '__root__') return -1
    if (b === '__root__') return 1
    return a.localeCompare(b)
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
      {sorted.map(([folder, paths]) => (
        <div key={folder}>
          {folder !== '__root__' && (
            <div style={{
              padding: '8px 16px 4px',
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {folder}/
            </div>
          )}
          {paths.sort().map(path => {
            const name = path.split('/').at(-1)!
            const active = selected === path
            return (
              <button
                key={path}
                onClick={() => onSelect(path)}
                style={{
                  width: '100%',
                  padding: '7px 16px',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  transition: 'all 0.1s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {name}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', maxWidth: 780 }}>
      {lines.map((line, i) => {
        if (line.startsWith('# '))
          return <h1 key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', marginBottom: 16, marginTop: i > 0 ? 32 : 0 }}>{line.slice(2)}</h1>
        if (line.startsWith('## '))
          return <h2 key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--accent)', marginBottom: 10, marginTop: 28 }}>{line.slice(3)}</h2>
        if (line.startsWith('### '))
          return <h3 key={i} style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{line.slice(4)}</h3>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <div key={i} style={{ color: 'var(--text-secondary)', paddingLeft: 16, marginBottom: 4, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: 'var(--accent)', opacity: 0.6 }}>·</span>
            {line.slice(2)}
          </div>
        if (line.startsWith('> '))
          return <blockquote key={i} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: '8px 0' }}>{line.slice(2)}</blockquote>
        if (line.startsWith('```') || line === '```')
          return null
        if (line.startsWith('|'))
          return <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{line}</div>
        if (line.trim() === '')
          return <div key={i} style={{ height: 8 }} />
        return <p key={i} style={{ color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.7 }}>{line}</p>
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.2 }}>
        <circle cx="16" cy="16" r="5" stroke="#4EFFC4" strokeWidth="1.5"/>
        <circle cx="16" cy="16" r="2" fill="#4EFFC4"/>
        <line x1="16" y1="4" x2="16" y2="10" stroke="#4EFFC4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="22" x2="16" y2="28" stroke="#4EFFC4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="16" x2="10" y2="16" stroke="#4EFFC4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="16" x2="28" y2="16" stroke="#4EFFC4" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 260, lineHeight: 1.8 }}>
        Open your Claude memory directory to begin. NeuroStack reads and writes markdown files directly.
      </p>
    </div>
  )
}

export function FileEditor({ directory, onWrite, jumpToPath, onJumped }: Props) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!jumpToPath || !directory) return
    const file = directory.files.get(jumpToPath)
    if (file) {
      setSelectedPath(jumpToPath)
      setEditContent(file.content)
      setIsDirty(false)
      setIsEditing(false)
      onJumped?.()
    }
  }, [jumpToPath, directory, onJumped])

  useEffect(() => {
    if (!selectedPath || !directory) return
    const file = directory.files.get(selectedPath)
    if (file && !isDirty) setEditContent(file.content)
  }, [selectedPath, directory, isDirty])

  const handleSelect = (path: string) => {
    if (isDirty && !confirm('Discard unsaved changes?')) return
    setSelectedPath(path)
    setIsEditing(false)
    setIsDirty(false)
    const file = directory?.files.get(path)
    if (file) setEditContent(file.content)
  }

  const handleSave = async () => {
    if (!selectedPath) return
    setSaving(true)
    const ok = await onWrite(selectedPath, editContent)
    setSaving(false)
    if (ok) {
      setIsDirty(false)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1800)
    }
  }

  const file = selectedPath ? directory?.files.get(selectedPath) : null

  if (!directory) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmptyState /></div>
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* File tree */}
      <div style={{ width: 200, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {directory.files.size} files
        </div>
        <FileTree files={directory.files} selected={selectedPath} onSelect={handleSelect} />
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {file ? (
          <>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ color: 'var(--accent)', fontSize: 12, flex: 1 }}>{selectedPath}</span>
              {isDirty && <span className="badge badge-amber">unsaved</span>}
              {savedFlash && <span className="badge badge-working">saved ✓</span>}
              <button
                onClick={() => setIsEditing(e => !e)}
                style={{ padding: '4px 12px', background: isEditing ? 'var(--accent-dim)' : 'var(--bg-overlay)', border: `1px solid ${isEditing ? 'rgba(78,255,196,0.25)' : 'var(--border-mid)'}`, borderRadius: 'var(--radius-sm)', color: isEditing ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.04em' }}
              >
                {isEditing ? 'preview' : 'edit'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  style={{ padding: '4px 12px', background: isDirty ? 'var(--accent)' : 'var(--bg-overlay)', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', color: isDirty ? '#0D0D0F' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', cursor: isDirty ? 'pointer' : 'default', transition: 'all 0.15s' }}
                >
                  {saving ? 'saving…' : 'save'}
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={e => { setEditContent(e.target.value); setIsDirty(true) }}
                  onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() } }}
                  style={{ width: '100%', height: '100%', background: 'var(--bg-base)', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, padding: '20px 24px', resize: 'none' }}
                  spellCheck={false}
                />
              ) : (
                <MarkdownPreview content={editContent} />
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 24, opacity: 0.3 }}>⬡</span>
            <span>Select a file to view</span>
          </div>
        )}
      </div>
    </div>
  )
}
