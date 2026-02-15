import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from '../shared/constants/channels'

type IpcCallback = (event: IpcRendererEvent, ...args: unknown[]) => void

const electronAPI = {
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    return ipcRenderer.invoke(channel, ...args)
  },

  send: (channel: string, ...args: unknown[]): void => {
    ipcRenderer.send(channel, ...args)
  },

  on: (channel: string, callback: IpcCallback): (() => void) => {
    ipcRenderer.on(channel, callback)
    return () => {
      ipcRenderer.removeListener(channel, callback)
    }
  },

  once: (channel: string, callback: IpcCallback): void => {
    ipcRenderer.once(channel, callback)
  },

  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  },

  ffmpeg: {
    convert: (input: string, output: string, options?: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.FFMPEG_CONVERT, { input, output, options }),
    cancel: (taskId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FFMPEG_CANCEL, { taskId }),
    getInfo: (filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FFMPEG_GET_INFO, { filePath }),
    onProgress: (callback: IpcCallback) => {
      ipcRenderer.on(IPC_CHANNELS.FFMPEG_PROGRESS, callback)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.FFMPEG_PROGRESS, callback)
    },
  },

  notification: {
    show: (options: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATION_SHOW, options),
    onClicked: (callback: IpcCallback) => {
      ipcRenderer.on(IPC_CHANNELS.NOTIFICATION_CLICKED, callback)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.NOTIFICATION_CLICKED, callback)
    },
  },

  websocket: {
    connect: (config: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.WS_CONNECT, config),
    disconnect: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.WS_DISCONNECT, { id }),
    send: (id: string, data: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.WS_SEND, { id, data }),
    onMessage: (callback: IpcCallback) => {
      ipcRenderer.on(IPC_CHANNELS.WS_MESSAGE, callback)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WS_MESSAGE, callback)
    },
    onStatus: (callback: IpcCallback) => {
      ipcRenderer.on(IPC_CHANNELS.WS_STATUS, callback)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WS_STATUS, callback)
    },
  },

  updater: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATER_CHECK),
    download: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATER_DOWNLOAD),
    install: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATER_INSTALL),
    onProgress: (callback: IpcCallback) => {
      ipcRenderer.on(IPC_CHANNELS.UPDATER_PROGRESS, callback)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATER_PROGRESS, callback)
    },
    onStatus: (callback: IpcCallback) => {
      ipcRenderer.on(IPC_CHANNELS.UPDATER_STATUS, callback)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATER_STATUS, callback)
    },
  },

  database: {
    query: (sql: string, params?: unknown[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.DB_QUERY, { sql, params }),
    execute: (sql: string, params?: unknown[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.DB_EXECUTE, { sql, params }),
    run: (sql: string, params?: unknown[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.DB_RUN, { sql, params }),
  },

  store: {
    get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.STORE_GET, { key }),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.STORE_SET, { key, value }),
    delete: (key: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.STORE_DELETE, { key }),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.STORE_CLEAR),
  },

  chat: {
    send: (messages: unknown[], apiKey: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND, { messages, apiKey }),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.CHAT_STOP),
    onChunk: (callback: IpcCallback) => {
      ipcRenderer.on(IPC_CHANNELS.CHAT_CHUNK, callback)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_CHUNK, callback)
    },
    onError: (callback: IpcCallback) => {
      ipcRenderer.on(IPC_CHANNELS.CHAT_ERROR, callback)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_ERROR, callback)
    },
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
