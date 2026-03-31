import { useState, useCallback, useEffect } from 'react'
import type { MemoryFile, MemoryDirectory, ActivityEvent, ProjectEntry } from '../types/memory'
import { getTemplates } from '../lib/bootstrapTemplates'

const DB_NAME = 'neurostack'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'directory'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY)
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function readDirIntoMap(
  dirHandle: FileSystemDirectoryHandle,
  files: Map<string, MemoryFile>,
  prefix = ''
): Promise<void> {
  for await (const [name, entry] of dirHandle.entries()) {
    if (entry.kind === 'file' && name.endsWith('.md')) {
      const fileHandle = entry as FileSystemFileHandle
      const file = await fileHandle.getFile()
      const content = await file.text()
      const path = prefix ? `${prefix}/${name}` : name
      files.set(path, { name, path, content, lastModified: file.lastModified })
    } else if (entry.kind === 'directory' && name !== 'node_modules' && !name.startsWith('.')) {
      await readDirIntoMap(entry as FileSystemDirectoryHandle, files, prefix ? `${prefix}/${name}` : name)
    }
  }
}

export function useMemoryFS() {
  const [directory, setDirectory] = useState<MemoryDirectory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set())
  const [newFiles, setNewFiles] = useState<string[]>([])
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([])
  const [projects, setProjects] = useState<ProjectEntry[]>([])

  // On mount: try to restore the last-used directory handle from IndexedDB
  useEffect(() => {
    let cancelled = false
    async function tryRestore() {
      try {
        const handle = await loadHandle()
        if (!handle || cancelled) return
        const permission = await handle.requestPermission({ mode: 'readwrite' })
        if (permission !== 'granted' || cancelled) return
        const files = new Map<string, MemoryFile>()
        await readDirIntoMap(handle, files)
        if (!cancelled) {
          setDirectory({ handle, files })
          setError(null)
        }
      } catch {
        // Permission denied or handle invalid — fall through to manual open
      } finally {
        if (!cancelled) setRestoring(false)
      }
    }
    tryRestore()
    return () => { cancelled = true }
  }, [])

  const openDirectory = useCallback(async () => {
    setLoading(true)
    try {
      const handle = await showDirectoryPicker({ mode: 'readwrite' })
      const files = new Map<string, MemoryFile>()
      await readDirIntoMap(handle, files)
      setDirectory({ handle, files })
      setError(null)
      // Persist handle so the next session can restore without re-prompting
      saveHandle(handle).catch(() => { /* non-critical */ })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Could not open directory. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleStaleHandle = useCallback((err: unknown) => {
    const name = (err as DOMException)?.name
    if (name === 'NotAllowedError' || name === 'NotFoundError') {
      setDirectory(null)
      setError('Directory access was lost. Please re-open your memory directory.')
      return true
    }
    return false
  }, [])

  const writeFile = useCallback(async (path: string, content: string) => {
    if (!directory) return false
    try {
      const parts = path.split('/')
      if (parts.some(p => p === '..' || p === '.' || p === '')) return false
      let dir = directory.handle

      for (const part of parts.slice(0, -1)) {
        dir = await dir.getDirectoryHandle(part, { create: true })
      }

      const fileHandle = await dir.getFileHandle(parts.at(-1)!, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      const updated = new Map(directory.files)
      updated.set(path, {
        name: parts.at(-1)!,
        path,
        content,
        lastModified: Date.now(),
      })
      setDirectory({ ...directory, files: updated })
      return true
    } catch (err) {
      handleStaleHandle(err)
      return false
    }
  }, [directory, handleStaleHandle])

  const refreshAll = useCallback(async () => {
    if (!directory) return
    const snapshot = directory
    const fresh = new Map<string, MemoryFile>()
    const changed: string[] = []
    const discovered: string[] = []
    const events: ActivityEvent[] = []

    async function scanDir(dirHandle: FileSystemDirectoryHandle, prefix = '') {
      for await (const [name, entry] of dirHandle.entries()) {
        if (entry.kind === 'file' && name.endsWith('.md')) {
          const fileHandle = entry as FileSystemFileHandle
          const file = await fileHandle.getFile()
          const path = prefix ? `${prefix}/${name}` : name
          const existing = snapshot.files.get(path)
          if (!existing || file.lastModified > existing.lastModified) {
            const content = await file.text()
            fresh.set(path, { name, path, content, lastModified: file.lastModified })
            changed.push(path)
            if (!existing) {
              discovered.push(path)
            } else {
              events.push({
                path,
                timestamp: Date.now(),
                prevLines: existing.content.split('\n').length,
                newLines: content.split('\n').length,
              })
            }
          } else {
            fresh.set(path, existing)
          }
        } else if (entry.kind === 'directory' && name !== 'node_modules' && !name.startsWith('.')) {
          await scanDir(entry as FileSystemDirectoryHandle, prefix ? `${prefix}/${name}` : name)
        }
      }
    }

    try {
      await scanDir(snapshot.handle)
      setDirectory({ ...snapshot, files: fresh })
      setChangedPaths(new Set(changed))
      if (discovered.length > 0) setNewFiles(prev => [...prev, ...discovered.filter(p => !prev.includes(p))])
      if (events.length > 0) setActivityLog(prev => [...prev, ...events].slice(-200))
    } catch (err) {
      handleStaleHandle(err)
    }
  }, [directory, handleStaleHandle])

  const refreshFile = useCallback(async (path: string) => {
    if (!directory) return
    try {
      const parts = path.split('/')
      let dir = directory.handle
      for (const part of parts.slice(0, -1)) {
        dir = await dir.getDirectoryHandle(part)
      }
      const fileHandle = await dir.getFileHandle(parts.at(-1)!)
      const file = await fileHandle.getFile()
      const content = await file.text()
      const updated = new Map(directory.files)
      updated.set(path, { name: parts.at(-1)!, path, content, lastModified: file.lastModified })
      setDirectory({ ...directory, files: updated })
    } catch (err) {
      handleStaleHandle(err)
    }
  }, [directory, handleStaleHandle])

  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    if (!directory) return false
    try {
      const parts = path.split('/')
      if (parts.some(p => p === '..' || p === '.' || p === '')) return false
      let dir = directory.handle
      for (const part of parts.slice(0, -1)) {
        dir = await dir.getDirectoryHandle(part)
      }
      await dir.removeEntry(parts.at(-1)!)
      const updated = new Map(directory.files)
      updated.delete(path)
      setDirectory({ ...directory, files: updated })
      return true
    } catch (err) {
      handleStaleHandle(err)
      return false
    }
  }, [directory, handleStaleHandle])

  const renameFile = useCallback(async (oldPath: string, newName: string): Promise<string | null> => {
    if (!directory) return null
    const file = directory.files.get(oldPath)
    if (!file) return null
    const parts = oldPath.split('/')
    const newPath = [...parts.slice(0, -1), newName].join('/')
    try {
      // Write new file
      const newParts = newPath.split('/')
      let dir = directory.handle
      for (const part of newParts.slice(0, -1)) {
        dir = await dir.getDirectoryHandle(part, { create: true })
      }
      const newHandle = await dir.getFileHandle(newParts.at(-1)!, { create: true })
      const writable = await newHandle.createWritable()
      await writable.write(file.content)
      await writable.close()
      // Remove old file
      const oldParts = oldPath.split('/')
      let oldDir = directory.handle
      for (const part of oldParts.slice(0, -1)) {
        oldDir = await oldDir.getDirectoryHandle(part)
      }
      await oldDir.removeEntry(oldParts.at(-1)!)
      // Update state
      const updated = new Map(directory.files)
      updated.delete(oldPath)
      updated.set(newPath, { name: newParts.at(-1)!, path: newPath, content: file.content, lastModified: Date.now() })
      setDirectory({ ...directory, files: updated })
      return newPath
    } catch (err) {
      handleStaleHandle(err)
      return null
    }
  }, [directory, handleStaleHandle])

  const openProjectBrowser = useCallback(async () => {
    try {
      const parentHandle = await showDirectoryPicker({ mode: 'readwrite' })
      const found: ProjectEntry[] = []
      for await (const [name, entry] of parentHandle.entries()) {
        if (entry.kind !== 'directory') continue
        const dir = entry as FileSystemDirectoryHandle
        let hasMd = false
        try {
          for await (const [fname] of dir.entries()) {
            if (fname.endsWith('.md')) { hasMd = true; break }
          }
        } catch { /* no access */ }
        if (!hasMd) {
          // check memory/ subdir
          try {
            const memDir = await dir.getDirectoryHandle('memory')
            for await (const [fname] of memDir.entries()) {
              if (fname.endsWith('.md')) { hasMd = true; break }
            }
          } catch { /* no memory subdir */ }
        }
        if (hasMd) found.push({ name, handle: dir })
      }
      if (found.length > 0) {
        setProjects(found)
        // Auto-load first project
        const files = new Map<string, MemoryFile>()
        await readDirIntoMap(found[0].handle, files)
        setDirectory({ handle: found[0].handle, files })
        setError(null)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError('Could not open project directory.')
    }
  }, [])

  const switchProject = useCallback(async (entry: ProjectEntry) => {
    setLoading(true)
    try {
      const permission = await entry.handle.requestPermission({ mode: 'readwrite' })
      if (permission !== 'granted') return
      const files = new Map<string, MemoryFile>()
      await readDirIntoMap(entry.handle, files)
      setDirectory({ handle: entry.handle, files })
      setError(null)
      saveHandle(entry.handle).catch(() => { /* non-critical */ })
    } catch (err) {
      handleStaleHandle(err)
    } finally {
      setLoading(false)
    }
  }, [handleStaleHandle])

  const clearNewFile = useCallback((path: string) => {
    setNewFiles(prev => prev.filter(p => p !== path))
  }, [])

  const bootstrapDirectory = useCallback(async (projectName: string) => {
    setLoading(true)
    try {
      const handle = await showDirectoryPicker({ mode: 'readwrite' })
      const templates = getTemplates(projectName)
      const files = new Map<string, MemoryFile>()
      for (const tpl of templates) {
        const parts = tpl.path.split('/')
        let dir = handle
        for (const part of parts.slice(0, -1)) {
          dir = await dir.getDirectoryHandle(part, { create: true })
        }
        const fileHandle = await dir.getFileHandle(parts.at(-1)!, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(tpl.content)
        await writable.close()
        files.set(tpl.path, {
          name: parts.at(-1)!,
          path: tpl.path,
          content: tpl.content,
          lastModified: Date.now(),
        })
      }
      setDirectory({ handle, files })
      setError(null)
      saveHandle(handle).catch(() => { /* non-critical */ })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Could not create directory. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { directory, error, loading, restoring, changedPaths, newFiles, activityLog, projects, openDirectory, writeFile, refreshAll, refreshFile, deleteFile, renameFile, clearNewFile, bootstrapDirectory, openProjectBrowser, switchProject }
}
