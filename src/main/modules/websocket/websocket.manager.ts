import WebSocket from 'ws'
import type { WebSocketConfig, WebSocketStatus, WebSocketState } from '../../../shared/types/websocket'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

interface WebSocketCallbacks {
  onMessage: (id: string, data: unknown) => void
  onStatusChange: (id: string, status: WebSocketStatus) => void
}

interface WebSocketConnection {
  ws: WebSocket
  config: WebSocketConfig
  state: WebSocketState
  heartbeatTimer?: NodeJS.Timeout
  reconnectTimer?: NodeJS.Timeout
  callbacks: WebSocketCallbacks
  messageQueue: unknown[]
}

export class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map()

  async connect(config: WebSocketConfig, callbacks: WebSocketCallbacks): Promise<string> {
    const id = config.id || generateId()
    
    if (this.connections.has(id)) {
      this.disconnect(id)
    }

    const state: WebSocketState = {
      id,
      url: config.url,
      status: 'connecting',
      reconnectAttempts: 0,
    }

    const connection: WebSocketConnection = {
      ws: null as unknown as WebSocket,
      config: {
        reconnect: true,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        heartbeatInterval: 30000,
        ...config,
        id,
      },
      state,
      callbacks,
      messageQueue: [],
    }

    this.connections.set(id, connection)
    await this.createConnection(id)

    return id
  }

  private async createConnection(id: string): Promise<void> {
    const connection = this.connections.get(id)
    if (!connection) return

    const { config, callbacks } = connection

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(config.url)

        ws.on('open', () => {
          connection.ws = ws
          connection.state.status = 'connected'
          connection.state.reconnectAttempts = 0
          connection.state.connectedAt = Date.now()
          callbacks.onStatusChange(id, 'connected')

          while (connection.messageQueue.length > 0) {
            const message = connection.messageQueue.shift()
            this.send(id, message)
          }

          this.startHeartbeat(id)
          resolve()
        })

        ws.on('message', (data) => {
          try {
            const parsed = JSON.parse(data.toString())
            callbacks.onMessage(id, parsed)
          } catch {
            callbacks.onMessage(id, data.toString())
          }
        })

        ws.on('close', () => {
          this.stopHeartbeat(id)
          connection.state.status = 'disconnected'
          connection.state.disconnectedAt = Date.now()
          callbacks.onStatusChange(id, 'disconnected')

          if (config.reconnect && connection.state.reconnectAttempts < (config.maxReconnectAttempts || 5)) {
            this.scheduleReconnect(id)
          }
        })

        ws.on('error', (error) => {
          connection.state.status = 'error'
          connection.state.lastError = error.message
          callbacks.onStatusChange(id, 'error')
          
          if (!connection.ws) {
            reject(error)
          }
        })

        connection.ws = ws
      } catch (error) {
        reject(error)
      }
    })
  }

  private scheduleReconnect(id: string): void {
    const connection = this.connections.get(id)
    if (!connection) return

    const { config, callbacks } = connection
    const delay = this.calculateReconnectDelay(connection.state.reconnectAttempts, config.reconnectInterval || 3000)

    connection.state.status = 'reconnecting'
    connection.state.reconnectAttempts++
    callbacks.onStatusChange(id, 'reconnecting')

    connection.reconnectTimer = setTimeout(async () => {
      try {
        await this.createConnection(id)
      } catch {
        if (connection.state.reconnectAttempts < (config.maxReconnectAttempts || 5)) {
          this.scheduleReconnect(id)
        }
      }
    }, delay)
  }

  private calculateReconnectDelay(attempts: number, baseInterval: number): number {
    return Math.min(baseInterval * Math.pow(2, attempts), 30000)
  }

  private startHeartbeat(id: string): void {
    const connection = this.connections.get(id)
    if (!connection || !connection.config.heartbeatInterval) return

    this.stopHeartbeat(id)

    connection.heartbeatTimer = setInterval(() => {
      if (connection.ws?.readyState === WebSocket.OPEN) {
        const heartbeatMessage = connection.config.heartbeatMessage || { type: 'ping' }
        connection.ws.send(
          typeof heartbeatMessage === 'string'
            ? heartbeatMessage
            : JSON.stringify(heartbeatMessage)
        )
      }
    }, connection.config.heartbeatInterval)
  }

  private stopHeartbeat(id: string): void {
    const connection = this.connections.get(id)
    if (connection?.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer)
      connection.heartbeatTimer = undefined
    }
  }

  send(id: string, data: unknown): void {
    const connection = this.connections.get(id)
    if (!connection) {
      throw new Error(`WebSocket connection ${id} not found`)
    }

    if (connection.ws?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      connection.ws.send(message)
    } else {
      connection.messageQueue.push(data)
    }
  }

  disconnect(id: string): void {
    const connection = this.connections.get(id)
    if (!connection) return

    this.stopHeartbeat(id)

    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer)
    }

    connection.config.reconnect = false

    if (connection.ws) {
      connection.ws.close()
    }

    this.connections.delete(id)
  }

  getState(id: string): WebSocketState | undefined {
    return this.connections.get(id)?.state
  }

  disconnectAll(): void {
    for (const id of this.connections.keys()) {
      this.disconnect(id)
    }
  }
}
