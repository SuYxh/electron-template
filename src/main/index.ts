import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './ipc'
import { initDatabase } from './modules/database'
import { initUpdater } from './modules/updater'
import { getAppStore } from './modules/database/store'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

async function createWindow() {
  const store = getAppStore()
  const windowBounds = store.get('windowBounds', {
    width: 1200,
    height: 800,
  })

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (isDev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      store.set('windowBounds', {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized: mainWindow.isMaximized(),
      })
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173')
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.commandLine.appendSwitch('no-sandbox')

app.whenReady().then(async () => {
  initDatabase()
  registerIpcHandlers()
  await createWindow()
  
  if (!isDev) {
    initUpdater(mainWindow)
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
