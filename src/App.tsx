import { useState, useCallback } from 'react'
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

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('editor')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  // Used to navigate to file editor with a specific file pre-selected
  const [editorJumpPath, setEditorJumpPath] = useState<string | undefined>()

  const { directory, error, loading, openDirectory, writeFile, refreshAll } = useMemoryFS()

  const handleRefresh = useCallback(async () => {
    await refreshAll()
    setLastRefreshed(new Date())
  }, [refreshAll])

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
          <Landing onOpen={openDirectory} loading={loading} error={error} />
        ) : (
          <>
            <TopBar
              activeView={activeView}
              onRefresh={handleRefresh}
              lastRefreshed={lastRefreshed}
            />

            <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-base)' }}>
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
