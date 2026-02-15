import type { IpcRendererEvent } from 'electron'
import type { NotificationOptions } from '../../shared/types/notification'
import type { WebSocketConfig, WebSocketStatus } from '../../shared/types/websocket'
import type { ChatMessage, ChatChunk } from '../../shared/types/chat'

type IpcCallback<T = unknown> = (event: IpcRendererEvent, data: T) => void

export interface ElectronAPI {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>
  send: (channel: string, ...args: unknown[]) => void
  on: <T = unknown>(channel: string, callback: IpcCallback<T>) => () => void
  once: <T = unknown>(channel: string, callback: IpcCallback<T>) => void
  removeAllListeners: (channel: string) => void

  ffmpeg: {
    convert: (
      input: string,
      output: string,
      options?: unknown
    ) => Promise<{ success: boolean; taskId?: string; error?: string }>
    cancel: (taskId: string) => Promise<{ success: boolean }>
    getInfo: (
      filePath: string
    ) => Promise<{ success: boolean; info?: unknown; error?: string }>
    onProgress: (callback: IpcCallback) => () => void
  }

  notification: {
    show: (
      options: NotificationOptions
    ) => Promise<{ success: boolean; id?: string }>
    onClicked: (callback: IpcCallback<{ id: string }>) => () => void
  }

  websocket: {
    connect: (
      config: WebSocketConfig
    ) => Promise<{ success: boolean; id: string; error?: string }>
    disconnect: (id: string) => Promise<{ success: boolean }>
    send: (
      id: string,
      data: unknown
    ) => Promise<{ success: boolean; error?: string }>
    onMessage: (callback: IpcCallback<{ id: string; data: unknown }>) => () => void
    onStatus: (
      callback: IpcCallback<{ id: string; status: WebSocketStatus }>
    ) => () => void
  }

  updater: {
    check: () => Promise<{ available: boolean; version?: string; error?: string }>
    download: () => Promise<{ success: boolean; error?: string }>
    install: () => Promise<void>
    onProgress: (callback: IpcCallback) => () => void
    onStatus: (callback: IpcCallback) => () => void
  }

  database: {
    query: (
      sql: string,
      params?: unknown[]
    ) => Promise<{ success: boolean; data?: unknown[]; error?: string }>
    execute: (
      sql: string,
      params?: unknown[]
    ) => Promise<{ success: boolean; changes?: number; error?: string }>
    run: (
      sql: string,
      params?: unknown[]
    ) => Promise<{
      success: boolean
      lastInsertRowid?: number
      changes?: number
      error?: string
    }>
  }

  store: {
    get: (key: string) => Promise<{ value: unknown }>
    set: (key: string, value: unknown) => Promise<{ success: boolean }>
    delete: (key: string) => Promise<{ success: boolean }>
    clear: () => Promise<{ success: boolean }>
  }

  chat: {
    send: (
      messages: ChatMessage[],
      apiKey: string
    ) => Promise<{ success: boolean; error?: string; aborted?: boolean }>
    stop: () => Promise<{ success: boolean }>
    onChunk: (callback: IpcCallback<ChatChunk>) => () => void
    onError: (callback: IpcCallback<{ error: string }>) => () => void
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
