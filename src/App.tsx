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

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('overview')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Used to navigate to file editor with a specific file pre-selected
  const [editorJumpPath, setEditorJumpPath] = useState<string | undefined>()
  // Session guide: show once per browser session after directory connects
  const [showSessionGuide, setShowSessionGuide] = useState(false)

  const { directory, error, loading, restoring, openDirectory, writeFile, refreshAll, refreshFile } = useMemoryFS()

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
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!directory ? (
          <Landing onOpen={openDirectory} loading={loading} restoring={restoring} error={error} />
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

            <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
              {activeView === 'overview' && (
                <Overview directory={directory} />
              )}
              {activeView === 'editor' && (
                <FileEditor
                  directory={directory}
                  onWrite={writeFile}
                  onRefreshFile={refreshFile}
                  jumpToPath={editorJumpPath}
                  onJumped={() => setEditorJumpPath(undefined)}
                />
              )}
              {activeView === 'agents' && (
                <AgentTracker directory={directory} onWrite={writeFile} />
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
