import { useState, useCallback, useEffect } from 'react'
import type { MemoryFile, MemoryDirectory } from '../types/memory'

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
    } catch (err) {
      handleStaleHandle(err)
    }
  }, [directory, handleStaleHandle])

  return { directory, error, loading, restoring, openDirectory, writeFile, refreshAll }
}
