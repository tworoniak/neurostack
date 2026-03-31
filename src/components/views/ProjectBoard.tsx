import { useMemo, useState } from 'react'
import type { MemoryDirectory } from '../../types/memory'
import { parseProjectStatus, type ProjectStatusEntry } from '../../lib/parseProjectStatus'

interface Props {
  directory: MemoryDirectory | null
  onNavigateToFile: (path: string) => void
}

const STATUS_COLS: { id: ProjectStatusEntry['status']; label: string; color: string; dimColor: string }[] = [
  { id: 'active',   label: 'Active',   color: 'var(--accent)',        dimColor: 'var(--accent-dim)' },
  { id: 'paused',   label: 'Paused',   color: 'var(--amber)',         dimColor: 'var(--amber-dim)' },
  { id: 'shipped',  label: 'Shipped',  color: 'var(--text-muted)',    dimColor: 'rgba(136,136,160,0.08)' },
  { id: 'unknown',  label: 'Unknown',  color: 'var(--border-mid)',    dimColor: 'rgba(80,80,100,0.1)' },
]

function ProjectCard({
  project,
  onNavigate,
}: {
  project: ProjectStatusEntry
  onNavigate: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const col = STATUS_COLS.find(c => c.id === project.status)!

  const hasBlockers = project.blockers.length > 0
  const hasCurrentWork = project.currentWork.length > 0

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-raised)',
        border: `1px solid ${hovered ? col.color : 'var(--border)'}`,
        borderLeft: `2px solid ${col.color}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        marginBottom: 8,
      }}
    >
      {/* Project name + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 12,
          color: 'var(--text-primary)',
          flex: 1,
          lineHeight: 1.4,
        }}>
          {project.name}
        </span>
        {hasBlockers && (
          <span style={{ fontSize: 10, color: 'var(--red)', flexShrink: 0 }} title="Has blockers">⚠</span>
        )}
      </div>

      {/* Current work preview */}
      {hasCurrentWork && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4 }}>
          {project.currentWork.split('\n')[0].replace(/^[-*]\s*/, '')}
        </div>
      )}

      {/* Branches pills */}
      {project.activeBranches.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {project.activeBranches.slice(0, 3).map(b => (
            <span key={b} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-muted)',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '1px 6px',
            }}>
              {b}
            </span>
          ))}
          {project.activeBranches.length > 3 && (
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{project.activeBranches.length - 3}</span>
          )}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {project.stack && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Stack</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{project.stack}</div>
            </div>
          )}

          {project.devPort && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Dev port</div>
              <a
                href={`http://localhost:${project.devPort}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                localhost:{project.devPort} ↗
              </a>
            </div>
          )}

          {hasBlockers && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Blockers</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {project.blockers.split('\n').slice(0, 3).map((l, i) => (
                  <div key={i}>{l.replace(/^[-*]\s*/, '')}</div>
                ))}
              </div>
            </div>
          )}

          {project.recentChanges.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Recent changes</div>
              {project.recentChanges.slice(0, 3).map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{c.date}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.change}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={e => { e.stopPropagation(); onNavigate(project.path) }}
            style={{
              padding: '4px 10px',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: 10,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              marginTop: 2,
            }}
          >
            Open in editor →
          </button>
        </div>
      )}
    </div>
  )
}

export function ProjectBoard({ directory, onNavigateToFile }: Props) {
  const projects = useMemo(() => {
    if (!directory) return []
    const results: ProjectStatusEntry[] = []
    for (const [path, file] of directory.files) {
      if (!path.startsWith('projects/') || !path.endsWith('.md')) continue
      const parsed = parseProjectStatus(path, file.content)
      if (parsed) results.push(parsed)
    }
    return results
  }, [directory])

  const grouped = useMemo(() => {
    const map: Record<ProjectStatusEntry['status'], ProjectStatusEntry[]> = {
      active: [], paused: [], shipped: [], unknown: [],
    }
    for (const p of projects) map[p.status].push(p)
    return map
  }, [projects])

  const blockedCount = projects.filter(p => p.blockers.length > 0).length

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>
            Projects
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} · reads projects/*.md
          </div>
        </div>
      </div>

      {/* Blocker alert */}
      {blockedCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'var(--red-dim)',
          border: '1px solid rgba(255,92,92,0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
        }}>
          <span style={{ color: 'var(--red)', fontSize: 14, flexShrink: 0 }}>⚠</span>
          <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>
            {blockedCount} project{blockedCount !== 1 ? 's' : ''} blocked
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            — {projects.filter(p => p.blockers.length > 0).map(p => p.name).join(', ')}
          </span>
        </div>
      )}

      {/* No projects folder */}
      {projects.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 0',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>◈</div>
          No project files found.<br/>
          <span style={{ fontSize: 11, opacity: 0.7 }}>Add .md files to a <code>projects/</code> subdirectory.</span>
        </div>
      )}

      {/* Board columns — only show columns that have projects or are 'active' */}
      {projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {STATUS_COLS.filter(col => col.id !== 'unknown' || grouped.unknown.length > 0).map(col => (
            <div key={col.id}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: `1px solid ${col.dimColor}`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 12,
                  color: col.color,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {col.label}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  background: col.dimColor,
                  color: col.color,
                  fontSize: 10,
                  padding: '1px 7px',
                  borderRadius: 99,
                }}>
                  {grouped[col.id].length}
                </span>
              </div>
              {grouped[col.id].map(project => (
                <ProjectCard key={project.id} project={project} onNavigate={onNavigateToFile} />
              ))}
              {grouped[col.id].length === 0 && (
                <div style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border)',
                }}>
                  empty
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
