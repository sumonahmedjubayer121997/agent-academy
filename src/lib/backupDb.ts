// Lightweight IndexedDB snapshot ring-buffer for local backup & crash recovery.
// Gracefully degrades to a no-op when IndexedDB is unavailable (e.g. jsdom tests).

const DB_NAME = 'agent-academy-backups'
const STORE_NAME = 'snapshots'
const MAX_SNAPSHOTS = 10

export interface SnapshotRecord {
  id: string
  label: string
  createdAt: string
  payload: string
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function saveIdbSnapshot(label: string, data: unknown): Promise<void> {
  const db = await openDb()
  if (!db) return
  try {
    const now = new Date().toISOString()
    const id = `${now.slice(0, 10)}-${label.replace(/\s+/g, '-').toLowerCase()}`
    const record: SnapshotRecord = {
      id,
      label,
      createdAt: now,
      payload: JSON.stringify(data),
    }
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    const all = await listIdbSnapshots()
    if (all.length > MAX_SNAPSHOTS) {
      const toDelete = all.slice(MAX_SNAPSHOTS)
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      for (const old of toDelete) {
        store.delete(old.id)
      }
    }
  } catch {
    /* ignore storage errors */
  }
}

export async function listIdbSnapshots(): Promise<SnapshotRecord[]> {
  const db = await openDb()
  if (!db) return []
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        const rows = (req.result as SnapshotRecord[]) ?? []
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        resolve(rows)
      }
      req.onerror = () => resolve([])
    } catch {
      resolve([])
    }
  })
}
