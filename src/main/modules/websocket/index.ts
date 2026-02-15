import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../shared/constants/channels'
import { WebSocketManager } from './websocket.manager'
import type { WebSocketConfig } from '../../../shared/types/websocket'

const wsManager = new WebSocketManager()

export function registerWebSocketHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.WS_CONNECT, async (_event, config: WebSocketConfig) => {
    try {
      const id = await wsManager.connect(config, {
        onMessage: (id, data) => {
          const windows = BrowserWindow.getAllWindows()
          windows.forEach((win) => {
            win.webContents.send(IPC_CHANNELS.WS_MESSAGE, { id, data })
          })
        },
        onStatusChange: (id, status) => {
          const windows = BrowserWindow.getAllWindows()
          windows.forEach((win) => {
            win.webContents.send(IPC_CHANNELS.WS_STATUS, { id, status })
          })
        },
      })
      return { success: true, id }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.WS_DISCONNECT, async (_event, { id }) => {
    try {
      wsManager.disconnect(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.WS_SEND, async (_event, { id, data }) => {
    try {
      wsManager.send(id, data)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}

export { WebSocketManager }
