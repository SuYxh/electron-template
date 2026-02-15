import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../shared/constants/channels'
import { getAppStore } from './store'
import { getMySQLPool, initMySQL, closeMySQL, isMySQLAvailable } from './mysql'

export function initDatabase(): void {
  const store = getAppStore()
  const dbUrl = store.get('databaseUrl' as keyof typeof store.store, '')
  
  if (dbUrl) {
    initMySQL(dbUrl as string)
  }
}

export function closeDatabase(): void {
  closeMySQL()
}

export function registerDatabaseHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.DB_QUERY, async (_event, { sql, params }) => {
    if (!isMySQLAvailable()) {
      return { success: false, error: 'Database not connected' }
    }
    
    try {
      const pool = getMySQLPool()
      const [rows] = await pool.execute(sql, params || [])
      return { success: true, data: rows }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_EXECUTE, async (_event, { sql, params }) => {
    if (!isMySQLAvailable()) {
      return { success: false, error: 'Database not connected' }
    }
    
    try {
      const pool = getMySQLPool()
      const [result] = await pool.execute(sql, params || [])
      return { success: true, changes: (result as { affectedRows?: number }).affectedRows || 0 }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_RUN, async (_event, { sql, params }) => {
    if (!isMySQLAvailable()) {
      return { success: false, error: 'Database not connected' }
    }
    
    try {
      const pool = getMySQLPool()
      const [result] = await pool.execute(sql, params || [])
      const res = result as { insertId?: number; affectedRows?: number }
      return {
        success: true,
        lastInsertRowid: res.insertId || 0,
        changes: res.affectedRows || 0,
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:connect', async (_event, { url }) => {
    try {
      await initMySQL(url)
      const store = getAppStore()
      store.set('databaseUrl' as keyof typeof store.store, url)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:disconnect', async () => {
    closeMySQL()
    return { success: true }
  })

  ipcMain.handle('db:status', async () => {
    return { connected: isMySQLAvailable() }
  })
}

export function registerStoreHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.STORE_GET, async (_event, { key }) => {
    const store = getAppStore()
    return { value: store.get(key as keyof typeof store.store) }
  })

  ipcMain.handle(IPC_CHANNELS.STORE_SET, async (_event, { key, value }) => {
    try {
      const store = getAppStore()
      store.set(key as keyof typeof store.store, value)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.STORE_DELETE, async (_event, { key }) => {
    try {
      const store = getAppStore()
      store.delete(key as keyof typeof store.store)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.STORE_CLEAR, async () => {
    try {
      const store = getAppStore()
      store.clear()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}

export { getAppStore } from './store'
export { getMySQLPool, isMySQLAvailable } from './mysql'
