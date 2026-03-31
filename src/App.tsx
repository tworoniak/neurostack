import { useState, useCallback, useEffect } from 'react'
import type { ViewId } from './types/memory'
import { useMemoryFS } from './hooks/useMemoryFS'
import { useFileWatcher } from './hooks/useFileWatcher'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { Landing } from './components/views/Landing'
import { FileEditor } from './components/views/FileEditor'
import { AgentTracker } from './components/views/AgentTracker'
import { Timeline } from './components/views/Timeline'
import { Search } from './components/views/Search'
import { Overview } from './components/views/Overview'
import { Gotchas } from './components/views/Gotchas'
import { SessionGuide } from './components/views/SessionGuide'
import { ProjectBoard } from './components/views/ProjectBoard'
import { InfraView } from './components/views/InfraView'
import { MetricsView } from './components/views/MetricsView'
import { ActivityFeed } from './components/views/ActivityFeed'
import { Decisions } from './components/views/Decisions'

function NewFileBanner({ path, inputId, onAdd, onDismiss }: {
  path: string
  inputId: string
  onAdd: (description: string) => Promise<void>
  onDismiss: () => void
}) {
  const [desc, setDesc] = useState('')
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 20px',
      background: 'rgba(78,255,196,0.05)',
      borderBottom: '1px solid rgba(78,255,196,0.15)',
      flexShrink: 0,
    }}>
      <span style={{ color: 'var(--accent)', fontSize: 12, flexShrink: 0 }}>✦ New file detected:</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{path}</span>
      <input
        id={inputId}
        placeholder="Add description for MEMORY.md index…"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && desc.trim()) onAdd(desc.trim()) }}
        style={{
          flex: 1,
          padding: '4px 8px',
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          outline: 'none',
          minWidth: 0,
        }}
      />
      <button
        onClick={() => { if (desc.trim()) onAdd(desc.trim()) }}
        disabled={!desc.trim()}
        style={{ padding: '3px 10px', background: desc.trim() ? 'var(--accent-dim)' : 'var(--bg-overlay)', border: `1px solid ${desc.trim() ? 'rgba(78,255,196,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: desc.trim() ? 'var(--accent)' : 'var(--text-muted)', fontSize: 11, cursor: desc.trim() ? 'pointer' : 'default' }}
      >
        Add to index
      </button>
      <button
        onClick={onDismiss}
        style={{ padding: '3px 8px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('overview')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Used to navigate to file editor with a specific file pre-selected
  const [editorJumpPath, setEditorJumpPath] = useState<string | undefined>()
  // Session guide: show once per browser session after directory connects
  const [showSessionGuide, setShowSessionGuide] = useState(false)

  const { directory, error, loading, restoring, changedPaths, newFiles, activityLog, projects, openDirectory, writeFile, refreshAll, refreshFile, deleteFile, renameFile, clearNewFile, bootstrapDirectory, openProjectBrowser, switchProject } = useMemoryFS()

  // Show session guide once per session when directory first connects
  useEffect(() => {
    if (directory && !sessionStorage.getItem('neurostack_guide_dismissed')) {
      setShowSessionGuide(true)
    }
  }, [directory])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refreshAll()
    setLastRefreshed(new Date())
    setRefreshing(false)
  }, [refreshAll])

  // ⌘Shift+R keyboard shortcut for manual refresh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === 'R' && directory && !refreshing) {
        e.preventDefault()
        handleRefresh()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [directory, refreshing, handleRefresh])

  // Auto-refresh on interval when directory is open
  useFileWatcher(directory, handleRefresh, 4000)

  const handleSelectFileFromSearch = (path: string) => {
    setEditorJumpPath(path)
    setActiveView('editor')
  }

  const handleGuideNavigate = (path: string) => {
    setEditorJumpPath(path)
    setActiveView('editor')
  }

  const handleGuideDismiss = () => {
    sessionStorage.setItem('neurostack_guide_dismissed', '1')
    setShowSessionGuide(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        directory={directory}
        onOpen={openDirectory}
        onBootstrap={bootstrapDirectory}
        projects={projects}
        onSwitchProject={switchProject}
        onBrowseProjects={openProjectBrowser}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!directory ? (
          <Landing onOpen={openDirectory} onBootstrap={bootstrapDirectory} loading={loading} restoring={restoring} error={error} />
        ) : (
          <>
            <TopBar
              activeView={activeView}
              onRefresh={handleRefresh}
              lastRefreshed={lastRefreshed}
              refreshing={refreshing}
            />

            {showSessionGuide && (
              <SessionGuide
                onNavigateToFile={handleGuideNavigate}
                onDismiss={handleGuideDismiss}
              />
            )}

            {/* Auto-index new file banners */}
            {newFiles
              .filter(p => {
                const memoryContent = directory?.files.get('MEMORY.md')?.content ?? ''
                return !memoryContent.includes(p.split('/').at(-1)!)
              })
              .map(path => {
                const name = path.split('/').at(-1)!
                const inputId = `new-file-${path}`
                return (
                  <NewFileBanner
                    key={path}
                    path={path}
                    inputId={inputId}
                    onAdd={async (desc) => {
                      const memFile = directory?.files.get('MEMORY.md')
                      if (memFile) {
                        const line = `- [${name}](${path}) — ${desc}`
                        await writeFile('MEMORY.md', memFile.content.trimEnd() + '\n' + line + '\n')
                      }
                      clearNewFile(path)
                    }}
                    onDismiss={() => clearNewFile(path)}
                  />
                )
              })}

            <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
              {activeView === 'overview' && (
                <Overview directory={directory} />
              )}
              {activeView === 'editor' && (
                <FileEditor
                  directory={directory}
                  onWrite={writeFile}
                  onRefreshFile={refreshFile}
                  onDelete={deleteFile}
                  onRename={renameFile}
                  changedPaths={changedPaths}
                  jumpToPath={editorJumpPath}
                  onJumped={() => setEditorJumpPath(undefined)}
                />
              )}
              {activeView === 'agents' && (
                <AgentTracker
                  directory={directory}
                  onWrite={writeFile}
                  onNavigateToFile={path => { setEditorJumpPath(path); setActiveView('editor') }}
                />
              )}
              {activeView === 'timeline' && (
                <Timeline directory={directory} onWrite={writeFile} />
              )}
              {activeView === 'gotchas' && (
                <Gotchas directory={directory} onWrite={writeFile} />
              )}
              {activeView === 'projects' && (
                <ProjectBoard directory={directory} onNavigateToFile={path => { setEditorJumpPath(path); setActiveView('editor') }} />
              )}
              {activeView === 'infra' && (
                <InfraView directory={directory} />
              )}
              {activeView === 'metrics' && (
                <MetricsView directory={directory} onWrite={writeFile} />
              )}
              {activeView === 'decisions' && (
                <Decisions directory={directory} onWrite={writeFile} />
              )}
              {activeView === 'activity' && (
                <ActivityFeed activityLog={activityLog} />
              )}
              {activeView === 'search' && (
                <Search directory={directory} onSelectFile={handleSelectFileFromSearch} />
              )}
            </main>
          </>
        )}
      </div>
    </div>
  )
}
