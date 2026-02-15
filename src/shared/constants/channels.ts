export const IPC_CHANNELS = {
  FFMPEG_CONVERT: 'ffmpeg:convert',
  FFMPEG_PROGRESS: 'ffmpeg:progress',
  FFMPEG_CANCEL: 'ffmpeg:cancel',
  FFMPEG_GET_INFO: 'ffmpeg:getInfo',

  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_CLICKED: 'notification:clicked',

  WS_CONNECT: 'ws:connect',
  WS_DISCONNECT: 'ws:disconnect',
  WS_SEND: 'ws:send',
  WS_MESSAGE: 'ws:message',
  WS_STATUS: 'ws:status',

  UPDATER_CHECK: 'updater:check',
  UPDATER_DOWNLOAD: 'updater:download',
  UPDATER_INSTALL: 'updater:install',
  UPDATER_PROGRESS: 'updater:progress',
  UPDATER_STATUS: 'updater:status',

  DB_QUERY: 'db:query',
  DB_EXECUTE: 'db:execute',
  DB_RUN: 'db:run',

  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
  STORE_DELETE: 'store:delete',
  STORE_CLEAR: 'store:clear',

  CHAT_SEND: 'chat:send',
  CHAT_CHUNK: 'chat:chunk',
  CHAT_STOP: 'chat:stop',
  CHAT_ERROR: 'chat:error',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
