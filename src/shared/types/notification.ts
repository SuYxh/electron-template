export interface NotificationOptions {
  id?: string
  title: string
  body: string
  icon?: string
  silent?: boolean
  urgency?: 'low' | 'normal' | 'critical'
  timeoutType?: 'default' | 'never'
}

export interface NotificationConfig {
  enabled: boolean
  sound: boolean
  maxQueue: number
}
