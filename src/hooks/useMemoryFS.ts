import { useState, useCallback } from 'react'
import type { MemoryFile, MemoryDirectory } from '../types/memory'

export function useMemoryFS() {
  const [directory, setDirectory] = useState<MemoryDirectory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const openDirectory = useCallback(async () => {
    setLoading(true)
    try {
      const handle = await showDirectoryPicker({ mode: 'readwrite' })
      const files = new Map<string, MemoryFile>()

      async function readDir(dirHandle: FileSystemDirectoryHandle, prefix = '') {
        for await (const [name, entry] of dirHandle.entries()) {
          if (entry.kind === 'file' && name.endsWith('.md')) {
            const fileHandle = entry as FileSystemFileHandle
            const file = await fileHandle.getFile()
            const content = await file.text()
            const path = prefix ? `${prefix}/${name}` : name
            files.set(path, { name, path, content, lastModified: file.lastModified })
          } else if (entry.kind === 'directory' && name !== 'node_modules' && !name.startsWith('.')) {
            await readDir(entry as FileSystemDirectoryHandle, prefix ? `${prefix}/${name}` : name)
          }
        }
      }

      await readDir(handle)
      setDirectory({ handle, files })
      setError(null)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Could not open directory. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
    } catch {
      return false
    }
  }, [directory])

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
    } catch {
      // file may have been deleted
    }
  }, [directory])

  const refreshAll = useCallback(async () => {
    if (!directory) return
    // Capture snapshot to avoid stale closure issues inside async scanDir
    const snapshot = directory
    // Build a fresh map so deleted files are not carried over
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

    await scanDir(snapshot.handle)
    setDirectory({ ...snapshot, files: fresh })
  }, [directory])

  return { directory, error, loading, openDirectory, writeFile, refreshFile, refreshAll }
}
