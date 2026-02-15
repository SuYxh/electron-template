import type { FFmpegConvertOptions, FFmpegProgress, MediaInfo } from './ffmpeg'
import type { NotificationOptions } from './notification'
import type { WebSocketConfig, WebSocketStatus } from './websocket'
import type { UpdaterStatus, UpdateProgress } from './updater'

export interface IpcRequest {
  'ffmpeg:convert': { input: string; output: string; options?: FFmpegConvertOptions }
  'ffmpeg:cancel': { taskId: string }
  'ffmpeg:getInfo': { filePath: string }

  'notification:show': NotificationOptions

  'ws:connect': WebSocketConfig
  'ws:disconnect': { id: string }
  'ws:send': { id: string; data: string | object }

  'updater:check': void
  'updater:download': void
  'updater:install': void

  'db:query': { sql: string; params?: unknown[] }
  'db:execute': { sql: string; params?: unknown[] }
  'db:run': { sql: string; params?: unknown[] }

  'store:get': { key: string }
  'store:set': { key: string; value: unknown }
  'store:delete': { key: string }
  'store:clear': void
}

export interface IpcResponse {
  'ffmpeg:convert': { success: boolean; taskId: string; error?: string }
  'ffmpeg:cancel': { success: boolean }
  'ffmpeg:getInfo': { success: boolean; info?: MediaInfo; error?: string }

  'notification:show': { success: boolean }

  'ws:connect': { success: boolean; id: string; error?: string }
  'ws:disconnect': { success: boolean }
  'ws:send': { success: boolean; error?: string }

  'updater:check': { available: boolean; version?: string; error?: string }
  'updater:download': { success: boolean; error?: string }
  'updater:install': void

  'db:query': { success: boolean; data?: unknown[]; error?: string }
  'db:execute': { success: boolean; changes?: number; error?: string }
  'db:run': { success: boolean; lastInsertRowid?: number; changes?: number; error?: string }

  'store:get': { value: unknown }
  'store:set': { success: boolean }
  'store:delete': { success: boolean }
  'store:clear': { success: boolean }
}

export interface IpcEvents {
  'ffmpeg:progress': FFmpegProgress
  'notification:clicked': { id: string }
  'ws:message': { id: string; data: unknown }
  'ws:status': { id: string; status: WebSocketStatus }
  'updater:progress': UpdateProgress
  'updater:status': UpdaterStatus
}
