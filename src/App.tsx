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

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('overview')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Used to navigate to file editor with a specific file pre-selected
  const [editorJumpPath, setEditorJumpPath] = useState<string | undefined>()

  const { directory, error, loading, restoring, openDirectory, writeFile, refreshAll } = useMemoryFS()

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

            <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
              {activeView === 'overview' && (
                <Overview directory={directory} />
              )}
              {activeView === 'editor' && (
                <FileEditor
                  directory={directory}
                  onWrite={writeFile}
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
