import { ipcMain } from 'electron'
import { registerFFmpegHandlers } from '../modules/ffmpeg'
import { registerNotificationHandlers } from '../modules/notification'
import { registerWebSocketHandlers } from '../modules/websocket'
import { registerUpdaterHandlers } from '../modules/updater'
import { registerDatabaseHandlers, registerStoreHandlers } from '../modules/database'
import { registerChatHandlers } from '../modules/chat'

export function registerIpcHandlers(): void {
  registerFFmpegHandlers()
  registerNotificationHandlers()
  registerWebSocketHandlers()
  registerUpdaterHandlers()
  registerDatabaseHandlers()
  registerStoreHandlers()
  registerChatHandlers()
  
  ipcMain.handle('app:getVersion', () => {
    const { app } = require('electron')
    return app.getVersion()
  })

  ipcMain.handle('app:getPlatform', () => {
    return process.platform
  })
}
