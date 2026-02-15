export const ipc = {
  async getVersion(): Promise<string> {
    return window.electronAPI.invoke('app:getVersion')
  },

  async getPlatform(): Promise<string> {
    return window.electronAPI.invoke('app:getPlatform')
  },

  ffmpeg: window.electronAPI?.ffmpeg,
  notification: window.electronAPI?.notification,
  websocket: window.electronAPI?.websocket,
  updater: window.electronAPI?.updater,
  database: window.electronAPI?.database,
  store: window.electronAPI?.store,
}
