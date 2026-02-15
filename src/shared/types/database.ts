export interface AppConfig {
  theme: 'light' | 'dark' | 'system'
  language: string
  autoUpdate: boolean
  windowBounds: WindowBounds
  notification: NotificationSettings
  databaseUrl: string
}

export interface WindowBounds {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized?: boolean
}

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
}

export const defaultAppConfig: AppConfig = {
  theme: 'system',
  language: 'zh-CN',
  autoUpdate: true,
  windowBounds: {
    width: 1200,
    height: 800,
  },
  notification: {
    enabled: true,
    sound: true,
  },
  databaseUrl: '',
}
