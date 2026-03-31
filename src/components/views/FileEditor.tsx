import { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MemoryDirectory, MemoryFile } from '../../types/memory';

const SAVED_FLASH_MS = 1800;

const GUARDED = new Set(['MEMORY.md', 'active-work.md'])

interface Props {
  directory: MemoryDirectory | null;
  onWrite: (path: string, content: string) => Promise<boolean>;
  onRefreshFile?: (path: string) => Promise<void>;
  onDelete?: (path: string) => Promise<boolean>;
  onRename?: (path: string, newName: string) => Promise<string | null>;
  changedPaths?: Set<string>;
  jumpToPath?: string;
  onJumped?: () => void;
}

function FileTree({
  files,
  selected,
  onSelect,
  changedPaths,
  onDelete,
  onRename,
  onFileDeleted,
  onFileRenamed,
}: {
  files: Map<string, MemoryFile>;
  selected: string | null;
  onSelect: (path: string) => void;
  changedPaths?: Set<string>;
  onDelete?: (path: string) => Promise<boolean>;
  onRename?: (path: string, newName: string) => Promise<string | null>;
  onFileDeleted?: (path: string) => void;
  onFileRenamed?: (oldPath: string, newPath: string) => void;
}) {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null);

  const grouped = new Map<string, string[]>();
  for (const path of files.keys()) {
    const parts = path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '__root__';
    if (!grouped.has(folder)) grouped.set(folder, []);
    grouped.get(folder)!.push(path);
  }

  const sorted = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === '__root__') return -1;
    if (b === '__root__') return 1;
    return a.localeCompare(b);
  });

  const allPaths = sorted.flatMap(([, paths]) => paths.sort());

  const handleRenameConfirm = async (path: string) => {
    if (!onRename || !renameValue.trim()) return;
    const newName = renameValue.trim().endsWith('.md') ? renameValue.trim() : `${renameValue.trim()}.md`;
    const newPath = await onRename(path, newName);
    if (newPath) {
      onFileRenamed?.(path, newPath);
      setRenamingPath(null);
      setRenameValue('');
    }
  };

  const handleDeleteConfirm = async (path: string) => {
    if (!onDelete) return;
    const ok = await onDelete(path);
    if (ok) {
      onFileDeleted?.(path);
      setConfirmDeletePath(null);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
      {sorted.map(([folder, paths]) => {
        const depth = folder === '__root__' ? 0 : folder.split('/').length;
        const folderLabel =
          folder === '__root__' ? null : folder.split('/').at(-1);
        return (
          <div key={folder}>
            {folderLabel && (
              <div
                style={{
                  padding: `8px ${16 + (depth - 1) * 10}px 4px`,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {folderLabel}/
              </div>
            )}
            {paths.sort().map((path) => {
              const name = path.split('/').at(-1)!;
              const active = selected === path;
              const fileDepth = path.split('/').length - 1;
              const isChanged = changedPaths?.has(path) && !active;
              const isHovered = hoveredPath === path;
              const isGuarded = GUARDED.has(name);

              if (renamingPath === path) {
                return (
                  <div key={path} style={{ padding: `4px ${16 + fileDepth * 10}px 4px` }}>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter') await handleRenameConfirm(path);
                        if (e.key === 'Escape') { setRenamingPath(null); setRenameValue(''); }
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 7px',
                        background: 'var(--bg-overlay)',
                        border: '1px solid var(--accent)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                );
              }

              if (confirmDeletePath === path) {
                return (
                  <div key={path} style={{
                    padding: `6px ${16 + fileDepth * 10}px 6px`,
                    background: 'rgba(255,92,92,0.06)',
                    borderLeft: '2px solid var(--red)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--red)', marginBottom: 4 }}>
                      {isGuarded ? `⚠ ${name} is critical — delete anyway?` : `Delete ${name}?`}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleDeleteConfirm(path)}
                        style={{ padding: '2px 8px', background: 'var(--red-dim)', border: '1px solid rgba(255,92,92,0.3)', borderRadius: 3, color: 'var(--red)', fontSize: 10, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeletePath(null)}
                        style={{ padding: '2px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={path}
                  onClick={() => onSelect(path)}
                  onMouseEnter={() => setHoveredPath(path)}
                  onMouseLeave={() => setHoveredPath(null)}
                  onKeyDown={(e) => {
                    const idx = allPaths.indexOf(path);
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (idx < allPaths.length - 1) onSelect(allPaths[idx + 1]);
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (idx > 0) onSelect(allPaths[idx - 1]);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: `7px 16px 7px ${16 + fileDepth * 10}px`,
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    border: 'none',
                    borderLeft: active
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </span>
                  {isChanged && (
                    <span
                      title="Changed since last refresh"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        flexShrink: 0,
                        opacity: 0.75,
                      }}
                    />
                  )}
                  {name === 'MEMORY.md' &&
                    (() => {
                      const lineCount = (files.get(path)?.content ?? '').split('\n').length;
                      const color =
                        lineCount >= 190
                          ? 'var(--red)'
                          : lineCount >= 150
                            ? 'var(--amber)'
                            : 'var(--text-muted)';
                      return (
                        <span
                          style={{ fontSize: 9, color, flexShrink: 0, opacity: 0.85 }}
                          title={`${lineCount} / 200 lines`}
                        >
                          {lineCount}L
                        </span>
                      );
                    })()}
                  {isHovered && (onRename || onDelete) && (
                    <span style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {onRename && (
                        <span
                          title="Rename"
                          onClick={e => { e.stopPropagation(); setRenameValue(name); setRenamingPath(path); }}
                          style={{ padding: '1px 4px', borderRadius: 3, color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', lineHeight: 1 }}
                        >
                          ✎
                        </span>
                      )}
                      {onDelete && (
                        <span
                          title="Delete"
                          onClick={e => { e.stopPropagation(); setConfirmDeletePath(path); }}
                          style={{ padding: '1px 4px', borderRadius: 3, color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', lineHeight: 1 }}
                        >
                          ×
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 28px',
        maxWidth: 780,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 22,
                color: 'var(--text-primary)',
                marginBottom: 16,
                marginTop: 32,
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 16,
                color: 'var(--accent)',
                marginBottom: 10,
                marginTop: 28,
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: 'var(--text-primary)',
                marginBottom: 6,
                marginTop: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              style={{
                color: 'var(--text-secondary)',
                marginBottom: 8,
                lineHeight: 1.7,
              }}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: '4px 0 8px', padding: 0, listStyle: 'none' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                color: 'var(--text-secondary)',
                paddingLeft: 20,
                marginBottom: 8,
              }}
            >
              {children}
            </ol>
          ),
          input: ({ type, checked }) => {
            if (type !== 'checkbox') return null
            return (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14,
                height: 14,
                borderRadius: 3,
                border: checked ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                background: checked ? 'var(--accent)' : 'transparent',
                marginRight: 6,
                flexShrink: 0,
                verticalAlign: 'middle',
                position: 'relative',
                top: -1,
              }}>
                {checked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3L3.5 5.5L8 1" stroke="#0D0D0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            )
          },
          li: ({ children, className }) => {
            const isTask = typeof className === 'string' && className.includes('task-list-item')
            return (
            <li
              style={{
                color: 'var(--text-secondary)',
                marginBottom: 4,
                paddingLeft: isTask ? 0 : 16,
                position: 'relative',
                display: isTask ? 'flex' : undefined,
                alignItems: isTask ? 'center' : undefined,
              }}
            >
              {!isTask && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  color: 'var(--accent)',
                  opacity: 0.6,
                }}
              >
                ·
              </span>
              )}
              {children}
            </li>
          )},
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: '2px solid var(--accent)',
                paddingLeft: 12,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                margin: '8px 0',
              }}
            >
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                overflowX: 'auto',
                marginBottom: 12,
              }}
            >
              {children}
            </pre>
          ),
          code: ({ children, className }) => (
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.7,
                color: className ? 'var(--text-secondary)' : 'var(--accent)',
                background: className ? 'transparent' : 'var(--bg-raised)',
                padding: className ? 0 : '1px 5px',
                borderRadius: className ? 0 : 3,
              }}
            >
              {children}
            </code>
          ),
          table: ({ children }) => (
            <table
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                marginBottom: 16,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th
              style={{
                borderBottom: '1px solid var(--border-mid)',
                padding: '6px 12px',
                textAlign: 'left',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                borderBottom: '1px solid var(--border)',
                padding: '6px 12px',
                color: 'var(--text-secondary)',
              }}
            >
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
              target='_blank'
              rel='noopener noreferrer'
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--border)',
                margin: '20px 0',
              }}
            />
          ),
          strong: ({ children }) => (
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em style={{ color: 'var(--text-muted)' }}>{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: 40,
      }}
    >
      <svg
        width='48'
        height='48'
        viewBox='0 0 32 32'
        fill='none'
        style={{ opacity: 0.2 }}
      >
        <circle cx='16' cy='16' r='5' stroke='#4EFFC4' strokeWidth='1.5' />
        <circle cx='16' cy='16' r='2' fill='#4EFFC4' />
        <line
          x1='16'
          y1='4'
          x2='16'
          y2='10'
          stroke='#4EFFC4'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <line
          x1='16'
          y1='22'
          x2='16'
          y2='28'
          stroke='#4EFFC4'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <line
          x1='4'
          y1='16'
          x2='10'
          y2='16'
          stroke='#4EFFC4'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <line
          x1='22'
          y1='16'
          x2='28'
          y2='16'
          stroke='#4EFFC4'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: 12,
          maxWidth: 260,
          lineHeight: 1.8,
        }}
      >
        Open your Claude memory directory to begin. NeuroStack reads and writes
        markdown files directly.
      </p>
    </div>
  );
}

export function FileEditor({
  directory,
  onWrite,
  onRefreshFile,
  onDelete,
  onRename,
  changedPaths,
  jumpToPath,
  onJumped,
}: Props) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [, setHistVersion] = useState(0);
  const [showCompact, setShowCompact] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findIdx, setFindIdx] = useState(0);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Back/forward history
  const histStack = useRef<string[]>([]);
  const histIdx = useRef(-1);

  useEffect(() => {
    if (!jumpToPath || !directory) return;
    const file = directory.files.get(jumpToPath);
    if (file) {
      setSelectedPath(jumpToPath);
      setEditContent(file.content);
      setIsDirty(false);
      setIsEditing(false);
      onJumped?.();
    }
  }, [jumpToPath, directory, onJumped]);

  useEffect(() => {
    if (!selectedPath || !directory) return;
    const file = directory.files.get(selectedPath);
    if (file && !isDirty) setEditContent(file.content);
  }, [selectedPath, directory, isDirty]);

  // Cmd+F / Ctrl+F opens inline find bar
  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setFindOpen(true);
        setTimeout(() => findInputRef.current?.select(), 10);
      }
      if (e.key === 'Escape' && findOpen) {
        setFindOpen(false);
        setFindQuery('');
        setFindIdx(0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedPath, findOpen]);

  const navigateTo = (path: string, fromHistory = false) => {
    setSelectedPath(path);
    setIsEditing(false);
    setIsDirty(false);
    setSaveError(false);
    setPendingPath(null);
    const file = directory?.files.get(path);
    if (file) setEditContent(file.content);
    if (!fromHistory) {
      // Truncate forward history, push new path
      histStack.current = histStack.current.slice(0, histIdx.current + 1);
      histStack.current.push(path);
      histIdx.current = histStack.current.length - 1;
    }
    setHistVersion(v => v + 1);
  };

  const canGoBack = histIdx.current > 0;
  const canGoForward = histIdx.current < histStack.current.length - 1;

  const handleSelect = (path: string) => {
    if (isDirty) {
      setPendingPath(path);
      return;
    }
    navigateTo(path);
  };

  const handleSave = async () => {
    if (!selectedPath) return;
    setSaving(true);
    setSaveError(false);
    const ok = await onWrite(selectedPath, editContent);
    setSaving(false);
    if (ok) {
      setIsDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), SAVED_FLASH_MS);
    } else {
      setSaveError(true);
    }
  };

  const file = useMemo(
    () => (selectedPath ? directory?.files.get(selectedPath) : null),
    [selectedPath, directory],
  );

  if (!directory) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EmptyState />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* File tree */}
      <div
        style={{
          width: 200,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ flex: 1 }}>{directory.files.size} files</span>
          <button
            onClick={() => {
              setCreatingFile((c) => !c);
              setNewFileName('');
            }}
            title='New file'
            style={{
              background: 'none',
              border: 'none',
              color: creatingFile ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 14,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            +
          </button>
        </div>
        {creatingFile && (
          <div
            style={{
              padding: '6px 10px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <input
              autoFocus
              placeholder='filename.md'
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Escape') {
                  setCreatingFile(false);
                  setNewFileName('');
                }
                if (e.key === 'Enter' && newFileName.trim()) {
                  const name = newFileName.trim().endsWith('.md')
                    ? newFileName.trim()
                    : `${newFileName.trim()}.md`;
                  const ok = await onWrite(name, '');
                  if (ok) {
                    setCreatingFile(false);
                    setNewFileName('');
                    navigateTo(name);
                  }
                }
              }}
              style={{
                width: '100%',
                padding: '5px 8px',
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-mid)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
            />
          </div>
        )}
        <FileTree
          files={directory.files}
          selected={selectedPath}
          onSelect={handleSelect}
          changedPaths={changedPaths}
          onDelete={onDelete}
          onRename={onRename}
          onFileDeleted={(path) => {
            if (selectedPath === path) {
              setSelectedPath(null);
              setEditContent('');
              setIsDirty(false);
            }
          }}
          onFileRenamed={(oldPath, newPath) => {
            if (selectedPath === oldPath) {
              setSelectedPath(newPath);
              // Update history stack
              histStack.current = histStack.current.map(p => p === oldPath ? newPath : p);
            }
          }}
        />
      </div>

      {/* Editor */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {file ? (
          <>
            {pendingPath && (
              <div
                style={{
                  padding: '8px 20px',
                  background: 'var(--amber-dim)',
                  borderBottom: '1px solid rgba(255,181,71,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexShrink: 0,
                  fontSize: 11,
                }}
              >
                <span style={{ color: 'var(--amber)', flex: 1 }}>
                  Unsaved changes will be lost.
                </span>
                <button
                  onClick={() => navigateTo(pendingPath)}
                  style={{
                    padding: '3px 10px',
                    background: 'var(--amber-dim)',
                    border: '1px solid rgba(255,181,71,0.4)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--amber)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={() => setPendingPath(null)}
                  style={{
                    padding: '3px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            <div
              style={{
                padding: '10px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              {/* Back / Forward */}
              <button
                onClick={() => {
                  if (!canGoBack) return;
                  histIdx.current -= 1;
                  navigateTo(histStack.current[histIdx.current], true);
                }}
                disabled={!canGoBack}
                title="Back"
                style={{
                  padding: '2px 7px',
                  background: 'none',
                  border: 'none',
                  color: canGoBack ? 'var(--text-secondary)' : 'var(--text-muted)',
                  fontSize: 14,
                  cursor: canGoBack ? 'pointer' : 'default',
                  opacity: canGoBack ? 1 : 0.35,
                  lineHeight: 1,
                }}
              >
                ←
              </button>
              <button
                onClick={() => {
                  if (!canGoForward) return;
                  histIdx.current += 1;
                  navigateTo(histStack.current[histIdx.current], true);
                }}
                disabled={!canGoForward}
                title="Forward"
                style={{
                  padding: '2px 7px',
                  background: 'none',
                  border: 'none',
                  color: canGoForward ? 'var(--text-secondary)' : 'var(--text-muted)',
                  fontSize: 14,
                  cursor: canGoForward ? 'pointer' : 'default',
                  opacity: canGoForward ? 1 : 0.35,
                  lineHeight: 1,
                }}
              >
                →
              </button>
              <span style={{ color: 'var(--accent)', fontSize: 12, flex: 1 }}>
                {selectedPath}
              </span>
              {isDirty && <span className='badge badge-amber'>unsaved</span>}
              {savedFlash && (
                <span className='badge badge-working'>saved ✓</span>
              )}
              {saveError && (
                <span className='badge badge-blocked'>save failed</span>
              )}
              {onRefreshFile && !isDirty && (
                <button
                  onClick={async () => {
                    if (!selectedPath) return
                    setRefreshing(true)
                    await onRefreshFile(selectedPath)
                    setRefreshing(false)
                  }}
                  disabled={refreshing}
                  title="Refresh file from disk"
                  style={{
                    padding: '4px 9px',
                    background: 'var(--bg-overlay)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                    lineHeight: 1,
                    opacity: refreshing ? 0.5 : 1,
                  }}
                >
                  ↺
                </button>
              )}
              {/* Compact index button — only for MEMORY.md ≥ 190 lines */}
              {selectedPath?.endsWith('MEMORY.md') &&
                (file?.content ?? '').split('\n').length >= 190 && (
                <button
                  onClick={() => setShowCompact(true)}
                  title="Compact the MEMORY.md index — remove stale entries"
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(255,92,92,0.1)',
                    border: '1px solid rgba(255,92,92,0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--red)',
                    fontSize: 11,
                    cursor: 'pointer',
                    letterSpacing: '0.03em',
                  }}
                >
                  Compact index
                </button>
              )}
              <button
                onClick={() => setIsEditing((e) => !e)}
                style={{
                  padding: '4px 12px',
                  background: isEditing
                    ? 'var(--accent-dim)'
                    : 'var(--bg-overlay)',
                  border: `1px solid ${isEditing ? 'rgba(78,255,196,0.25)' : 'var(--border-mid)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: isEditing ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                }}
              >
                {isEditing ? 'preview' : 'edit'}
              </button>
              {isEditing && (
                <>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ⌘S to save
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    style={{
                      padding: '4px 12px',
                      background: isDirty
                        ? 'var(--accent)'
                        : 'var(--bg-overlay)',
                      border: '1px solid transparent',
                      borderRadius: 'var(--radius-sm)',
                      color: isDirty ? '#0D0D0F' : 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      cursor: isDirty ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                    }}
                  >
                    {saving ? 'saving…' : 'save'}
                  </button>
                </>
              )}
            </div>
            {/* Inline find bar */}
            {findOpen && (() => {
              const matches: number[] = []
              if (findQuery.trim()) {
                const q = findQuery.toLowerCase()
                const lines = editContent.split('\n')
                lines.forEach((line, i) => { if (line.toLowerCase().includes(q)) matches.push(i) })
              }
              const safeIdx = matches.length > 0 ? ((findIdx % matches.length) + matches.length) % matches.length : 0
              return (
                <div style={{ padding: '6px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-raised)', flexShrink: 0 }}>
                  <input
                    ref={findInputRef}
                    placeholder="Find in file…"
                    value={findQuery}
                    onChange={e => { setFindQuery(e.target.value); setFindIdx(0) }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); setFindIdx(i => i + (e.shiftKey ? -1 : 1)) }
                      if (e.key === 'Escape') { setFindOpen(false); setFindQuery(''); setFindIdx(0) }
                    }}
                    style={{ flex: 1, padding: '4px 8px', background: 'var(--bg-overlay)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }}
                  />
                  {findQuery.trim() && (
                    <span style={{ fontSize: 11, color: matches.length > 0 ? 'var(--accent)' : 'var(--red)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {matches.length > 0 ? `${safeIdx + 1} / ${matches.length}` : 'no matches'}
                    </span>
                  )}
                  <button onClick={() => setFindIdx(i => i - 1)} disabled={matches.length === 0} style={{ padding: '2px 7px', background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>↑</button>
                  <button onClick={() => setFindIdx(i => i + 1)} disabled={matches.length === 0} style={{ padding: '2px 7px', background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>↓</button>
                  <button onClick={() => { setFindOpen(false); setFindQuery(''); setFindIdx(0) }} style={{ padding: '2px 6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              )
            })()}

            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value);
                    setIsDirty(true);
                  }}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--bg-base)',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    lineHeight: 1.7,
                    padding: '20px 24px',
                    resize: 'none',
                  }}
                  spellCheck={false}
                />
              ) : findOpen && findQuery.trim() ? (
                <FindResults content={editContent} query={findQuery} matchIdx={findIdx} />
              ) : (
                <MarkdownPreview content={editContent} />
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 12,
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24, opacity: 0.3 }}>⬡</span>
            <span>Select a file to view</span>
          </div>
        )}
      </div>

      {/* MEMORY.md compaction modal */}
      {showCompact && file && (
        <CompactModal
          content={file.content}
          files={directory.files}
          onConfirm={async (newContent) => {
            await onWrite(selectedPath!, newContent)
            setShowCompact(false)
          }}
          onClose={() => setShowCompact(false)}
        />
      )}
    </div>
  );
}

function CompactModal({
  content,
  files,
  onConfirm,
  onClose,
}: {
  content: string;
  files: Map<string, MemoryFile>;
  onConfirm: (newContent: string) => Promise<void>;
  onClose: () => void;
}) {
  const allLines = content.split('\n');
  const entryIndices: number[] = [];
  for (let i = 0; i < allLines.length; i++) {
    if (/^-\s+.*(\.md)/.test(allLines[i])) entryIndices.push(i);
  }

  const [checked, setChecked] = useState<Set<number>>(() => new Set(entryIndices));

  const toggle = (idx: number) =>
    setChecked(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  const extractPath = (line: string): string | null => {
    const linkMatch = line.match(/\]\(([^)]+\.md)\)/);
    if (linkMatch) return linkMatch[1];
    const backtickMatch = line.match(/`([^`]+\.md)`/);
    if (backtickMatch) return backtickMatch[1];
    return null;
  };

  const handleConfirm = async () => {
    const newLines = allLines.filter((_, i) => !entryIndices.includes(i) || checked.has(i));
    await onConfirm(newLines.join('\n'));
  };

  const removed = entryIndices.length - checked.size;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-lg)', width: 520, maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Compact MEMORY.md index</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Uncheck entries to remove. Red = file not found.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {entryIndices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>No index entries found.</div>
          ) : entryIndices.map(idx => {
            const line = allLines[idx];
            const path = extractPath(line);
            const exists = path ? files.has(path) : true;
            const isChecked = checked.has(idx);
            return (
              <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                <input type="checkbox" checked={isChecked} onChange={() => toggle(idx)} style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: !exists ? 'var(--red)' : isChecked ? 'var(--text-secondary)' : 'var(--text-muted)', textDecoration: isChecked ? 'none' : 'line-through', opacity: isChecked ? 1 : 0.5, flex: 1 }}>
                  {line.trim()}
                  {!exists && <span style={{ color: 'var(--red)', marginLeft: 6, fontSize: 10 }}>· not found</span>}
                </span>
              </label>
            );
          })}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)' }}>{removed > 0 ? `Remove ${removed} entr${removed !== 1 ? 'ies' : 'y'}` : 'No changes'}</span>
          <button onClick={handleConfirm} disabled={removed === 0} style={{ padding: '6px 16px', background: removed > 0 ? 'var(--accent-dim)' : 'var(--bg-overlay)', border: `1px solid ${removed > 0 ? 'rgba(78,255,196,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: removed > 0 ? 'var(--accent)' : 'var(--text-muted)', fontSize: 11, cursor: removed > 0 ? 'pointer' : 'default' }}>
            Apply compaction
          </button>
          <button onClick={onClose} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function FindResults({ content, query, matchIdx }: { content: string; query: string; matchIdx: number }) {
  const lines = content.split('\n');
  const q = query.toLowerCase();
  const matchLines: number[] = lines.reduce<number[]>((acc, line, i) => {
    if (line.toLowerCase().includes(q)) acc.push(i);
    return acc;
  }, []);
  const safeIdx = matchLines.length > 0 ? ((matchIdx % matchLines.length) + matchLines.length) % matchLines.length : -1;
  const currentLine = safeIdx >= 0 ? matchLines[safeIdx] : -1;

  const highlightLine = (line: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let offset = 0;
    while (true) {
      const idx = remaining.toLowerCase().indexOf(q);
      if (idx === -1) { parts.push(remaining); break; }
      if (idx > 0) parts.push(remaining.slice(0, idx));
      parts.push(
        <mark key={offset + idx} style={{ background: 'rgba(78,255,196,0.3)', color: 'inherit', borderRadius: 2 }}>
          {remaining.slice(idx, idx + q.length)}
        </mark>
      );
      remaining = remaining.slice(idx + q.length);
      offset += idx + q.length;
    }
    return parts;
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7 }}>
      {lines.map((line, i) => {
        const isMatch = matchLines.includes(i);
        const isCurrent = i === currentLine;
        return (
          <div
            key={i}
            id={isCurrent ? 'find-current' : undefined}
            ref={isCurrent ? (el => el?.scrollIntoView({ block: 'center' })) : undefined}
            style={{
              display: 'flex',
              gap: 16,
              padding: '1px 8px',
              borderRadius: 4,
              background: isCurrent ? 'rgba(78,255,196,0.1)' : isMatch ? 'rgba(78,255,196,0.04)' : 'transparent',
              opacity: isMatch ? 1 : 0.35,
            }}
          >
            <span style={{ width: 36, flexShrink: 0, textAlign: 'right', color: 'var(--text-muted)', userSelect: 'none', fontSize: 10 }}>{i + 1}</span>
            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{isMatch ? highlightLine(line) : line || '\u00a0'}</span>
          </div>
        );
      })}
    </div>
  );
}
