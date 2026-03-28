import { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { MemoryDirectory } from '../../types/memory'

const SAVED_FLASH_MS = 1800

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

  // Flat ordered list of all paths for keyboard navigation
  const allPaths = sorted.flatMap(([, paths]) => paths.sort())

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
      {sorted.map(([folder, paths]) => {
        const depth = folder === '__root__' ? 0 : folder.split('/').length
        const folderLabel = folder === '__root__' ? null : folder.split('/').at(-1)
        return (
          <div key={folder}>
            {folderLabel && (
              <div style={{
                padding: `8px ${16 + (depth - 1) * 10}px 4px`,
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {folderLabel}/
              </div>
            )}
            {paths.sort().map(path => {
              const name = path.split('/').at(-1)!
              const active = selected === path
              const fileDepth = path.split('/').length - 1
              return (
                <button
                  key={path}
                  onClick={() => onSelect(path)}
                  onKeyDown={e => {
                    const idx = allPaths.indexOf(path)
                    if (e.key === 'ArrowDown') { e.preventDefault(); if (idx < allPaths.length - 1) onSelect(allPaths[idx + 1]) }
                    if (e.key === 'ArrowUp')   { e.preventDefault(); if (idx > 0) onSelect(allPaths[idx - 1]) }
                  }}
                  style={{
                    width: '100%',
                    padding: `7px 16px 7px ${16 + fileDepth * 10}px`,
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
        )
      })}
    </div>
  )
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', maxWidth: 780 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', marginBottom: 16, marginTop: 32 }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--accent)', marginBottom: 10, marginTop: 28 }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</h3>,
          p: ({ children }) => <p style={{ color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.7 }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: '4px 0 8px', padding: 0, listStyle: 'none' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ color: 'var(--text-secondary)', paddingLeft: 20, marginBottom: 8 }}>{children}</ol>,
          li: ({ children }) => (
            <li style={{ color: 'var(--text-secondary)', marginBottom: 4, paddingLeft: 16, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--accent)', opacity: 0.6 }}>·</span>
              {children}
            </li>
          ),
          blockquote: ({ children }) => <blockquote style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: '8px 0' }}>{children}</blockquote>,
          pre: ({ children }) => <pre style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', overflowX: 'auto', marginBottom: 12 }}>{children}</pre>,
          code: ({ children, className }) => (
            <code style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.7,
              color: className ? 'var(--text-secondary)' : 'var(--accent)',
              background: className ? 'transparent' : 'var(--bg-raised)',
              padding: className ? 0 : '1px 5px',
              borderRadius: className ? 0 : 3,
            }}>
              {children}
            </code>
          ),
          table: ({ children }) => <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 16, fontSize: 12, fontFamily: 'var(--font-mono)' }}>{children}</table>,
          th: ({ children }) => <th style={{ borderBottom: '1px solid var(--border-mid)', padding: '6px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>{children}</th>,
          td: ({ children }) => <td style={{ borderBottom: '1px solid var(--border)', padding: '6px 12px', color: 'var(--text-secondary)' }}>{children}</td>,
          a: ({ children, href }) => <a href={href} style={{ color: 'var(--accent)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">{children}</a>,
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />,
          strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>,
          em: ({ children }) => <em style={{ color: 'var(--text-muted)' }}>{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
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
  const [saveError, setSaveError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const [creatingFile, setCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')

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

  const navigateTo = (path: string) => {
    setSelectedPath(path)
    setIsEditing(false)
    setIsDirty(false)
    setSaveError(false)
    setPendingPath(null)
    const file = directory?.files.get(path)
    if (file) setEditContent(file.content)
  }

  const handleSelect = (path: string) => {
    if (isDirty) { setPendingPath(path); return }
    navigateTo(path)
  }

  const handleSave = async () => {
    if (!selectedPath) return
    setSaving(true)
    setSaveError(false)
    const ok = await onWrite(selectedPath, editContent)
    setSaving(false)
    if (ok) {
      setIsDirty(false)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), SAVED_FLASH_MS)
    } else {
      setSaveError(true)
    }
  }

  const file = useMemo(
    () => (selectedPath ? directory?.files.get(selectedPath) : null),
    [selectedPath, directory]
  )

  if (!directory) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmptyState /></div>
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* File tree */}
      <div style={{ width: 200, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          <span style={{ flex: 1 }}>{directory.files.size} files</span>
          <button
            onClick={() => { setCreatingFile(c => !c); setNewFileName('') }}
            title="New file"
            style={{ background: 'none', border: 'none', color: creatingFile ? 'var(--accent)' : 'var(--text-muted)', fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
          >
            +
          </button>
        </div>
        {creatingFile && (
          <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
            <input
              autoFocus
              placeholder="filename.md"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Escape') { setCreatingFile(false); setNewFileName('') }
                if (e.key === 'Enter' && newFileName.trim()) {
                  const name = newFileName.trim().endsWith('.md') ? newFileName.trim() : `${newFileName.trim()}.md`
                  const ok = await onWrite(name, '')
                  if (ok) { setCreatingFile(false); setNewFileName(''); navigateTo(name) }
                }
              }}
              style={{ width: '100%', padding: '5px 8px', background: 'var(--bg-overlay)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 11, fontFamily: 'var(--font-mono)', outline: 'none' }}
            />
          </div>
        )}
        <FileTree files={directory.files} selected={selectedPath} onSelect={handleSelect} />
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {file ? (
          <>
            {pendingPath && (
              <div style={{ padding: '8px 20px', background: 'var(--amber-dim)', borderBottom: '1px solid rgba(255,181,71,0.2)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, fontSize: 11 }}>
                <span style={{ color: 'var(--amber)', flex: 1 }}>Unsaved changes will be lost.</span>
                <button onClick={() => navigateTo(pendingPath)} style={{ padding: '3px 10px', background: 'var(--amber-dim)', border: '1px solid rgba(255,181,71,0.4)', borderRadius: 'var(--radius-sm)', color: 'var(--amber)', fontSize: 11, cursor: 'pointer' }}>Discard</button>
                <button onClick={() => setPendingPath(null)} style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
              </div>
            )}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ color: 'var(--accent)', fontSize: 12, flex: 1 }}>{selectedPath}</span>
              {isDirty && <span className="badge badge-amber">unsaved</span>}
              {savedFlash && <span className="badge badge-working">saved ✓</span>}
              {saveError && <span className="badge badge-blocked">save failed</span>}
              <button
                onClick={() => setIsEditing(e => !e)}
                style={{ padding: '4px 12px', background: isEditing ? 'var(--accent-dim)' : 'var(--bg-overlay)', border: `1px solid ${isEditing ? 'rgba(78,255,196,0.25)' : 'var(--border-mid)'}`, borderRadius: 'var(--radius-sm)', color: isEditing ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.04em' }}
              >
                {isEditing ? 'preview' : 'edit'}
              </button>
              {isEditing && (
                <>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>⌘S to save</span>
                  <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    style={{ padding: '4px 12px', background: isDirty ? 'var(--accent)' : 'var(--bg-overlay)', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', color: isDirty ? '#0D0D0F' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', cursor: isDirty ? 'pointer' : 'default', transition: 'all 0.15s' }}
                  >
                    {saving ? 'saving…' : 'save'}
                  </button>
                </>
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
