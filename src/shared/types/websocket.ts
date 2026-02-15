export interface WebSocketConfig {
  url: string
  id?: string
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  heartbeatMessage?: string | object
}

export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'

export interface WebSocketMessage {
  id: string
  data: unknown
  timestamp: number
}

export interface WebSocketState {
  id: string
  url: string
  status: WebSocketStatus
  reconnectAttempts: number
  lastError?: string
  connectedAt?: number
  disconnectedAt?: number
}
