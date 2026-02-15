import { ipcMain, Notification, BrowserWindow, nativeImage } from 'electron'
import path from 'path'
import { IPC_CHANNELS } from '../../../shared/constants/channels'
import type { NotificationOptions } from '../../../shared/types/notification'

let notificationQueue: NotificationOptions[] = []
let isShowingNotification = false
const MAX_QUEUE_SIZE = 10

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function showNextNotification(): void {
  if (isShowingNotification || notificationQueue.length === 0) {
    return
  }

  const options = notificationQueue.shift()
  if (!options) return

  isShowingNotification = true
  const notificationId = options.id || generateId()

  const notification = new Notification({
    title: options.title,
    body: options.body,
    silent: options.silent ?? false,
    urgency: options.urgency ?? 'normal',
    timeoutType: options.timeoutType ?? 'default',
    icon: options.icon ? nativeImage.createFromPath(options.icon) : undefined,
  })

  notification.on('click', () => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      win.webContents.send(IPC_CHANNELS.NOTIFICATION_CLICKED, { id: notificationId })
      win.show()
      win.focus()
    })
  })

  notification.on('close', () => {
    isShowingNotification = false
    showNextNotification()
  })

  notification.show()
}

function showNotification(options: NotificationOptions): { success: boolean; id?: string } {
  if (!Notification.isSupported()) {
    return { success: false }
  }

  const notificationId = options.id || generateId()
  const notificationOptions = { ...options, id: notificationId }

  if (notificationQueue.length >= MAX_QUEUE_SIZE) {
    notificationQueue.shift()
  }

  notificationQueue.push(notificationOptions)
  showNextNotification()

  return { success: true, id: notificationId }
}

export function registerNotificationHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_SHOW, async (_event, options: NotificationOptions) => {
    return showNotification(options)
  })
}

export { showNotification }
