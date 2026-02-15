import { ipcMain, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IPC_CHANNELS } from '../../../shared/constants/channels'
import type { UpdaterStatus, UpdateProgress } from '../../../shared/types/updater'

let mainWindow: BrowserWindow | null = null
let currentStatus: UpdaterStatus = 'idle'

function sendStatus(status: UpdaterStatus): void {
  currentStatus = status
  if (mainWindow) {
    mainWindow.webContents.send(IPC_CHANNELS.UPDATER_STATUS, status)
  }
}

function sendProgress(progress: UpdateProgress): void {
  if (mainWindow) {
    mainWindow.webContents.send(IPC_CHANNELS.UPDATER_PROGRESS, progress)
  }
}

export function initUpdater(window: BrowserWindow | null): void {
  mainWindow = window

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    sendStatus('checking')
  })

  autoUpdater.on('update-available', (_info) => {
    sendStatus('available')
  })

  autoUpdater.on('update-not-available', (_info) => {
    sendStatus('not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    sendStatus('downloading')
    sendProgress({
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      total: progress.total,
      transferred: progress.transferred,
    })
  })

  autoUpdater.on('update-downloaded', (_info) => {
    sendStatus('downloaded')
  })

  autoUpdater.on('error', (error) => {
    sendStatus('error')
    console.error('Update error:', error)
  })
}

export function registerUpdaterHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.UPDATER_CHECK, async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        available: result?.updateInfo?.version !== undefined,
        version: result?.updateInfo?.version,
      }
    } catch (error) {
      return {
        available: false,
        error: (error as Error).message,
      }
    }
  })

  ipcMain.handle(IPC_CHANNELS.UPDATER_DOWNLOAD, async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.UPDATER_INSTALL, async () => {
    autoUpdater.quitAndInstall(false, true)
  })

  ipcMain.handle('updater:getStatus', () => {
    return currentStatus
  })
}
