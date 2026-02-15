import { useState, useCallback, useEffect, useRef } from 'react'
import type { WebSocketConfig, WebSocketStatus } from '../../shared/types/websocket'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [messages, setMessages] = useState<unknown[]>([])
  const connectionIdRef = useRef<string | null>(null)
  const browserWsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!isElectron) return

    const unsubscribeMessage = window.electronAPI.websocket.onMessage((_, data) => {
      const { id, data: messageData } = data
      if (id === connectionIdRef.current) {
        setMessages((prev) => [...prev, messageData])
        console.log('WebSocket message:', messageData)
      }
    })

    const unsubscribeStatus = window.electronAPI.websocket.onStatus((_, data) => {
      const { id, status: newStatus } = data
      if (id === connectionIdRef.current) {
        setStatus(newStatus)
      }
    })

    return () => {
      unsubscribeMessage()
      unsubscribeStatus()
    }
  }, [])

  const connect = useCallback(async (config: WebSocketConfig) => {
    if (!isElectron) {
      return new Promise<string>((resolve, reject) => {
        try {
          setStatus('connecting')
          const ws = new WebSocket(config.url)
          
          ws.onopen = () => {
            setStatus('connected')
            browserWsRef.current = ws
            resolve('browser-ws')
          }
          
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              setMessages((prev) => [...prev, data])
              console.log('WebSocket message:', data)
            } catch {
              setMessages((prev) => [...prev, event.data])
              console.log('WebSocket message:', event.data)
            }
          }
          
          ws.onclose = () => {
            setStatus('disconnected')
            browserWsRef.current = null
          }
          
          ws.onerror = () => {
            setStatus('error')
            reject(new Error('WebSocket connection failed'))
          }
        } catch (error) {
          setStatus('error')
          reject(error)
        }
      })
    }

    try {
      setStatus('connecting')
      const result = await window.electronAPI.websocket.connect(config)
      if (result.success) {
        connectionIdRef.current = result.id
        return result.id
      } else {
        setStatus('error')
        throw new Error(result.error)
      }
    } catch (error) {
      setStatus('error')
      throw error
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (!isElectron) {
      if (browserWsRef.current) {
        browserWsRef.current.close()
        browserWsRef.current = null
        setStatus('disconnected')
      }
      return
    }

    if (connectionIdRef.current) {
      await window.electronAPI.websocket.disconnect(connectionIdRef.current)
      connectionIdRef.current = null
      setStatus('disconnected')
    }
  }, [])

  const send = useCallback(async (data: unknown) => {
    if (!isElectron) {
      if (browserWsRef.current?.readyState === WebSocket.OPEN) {
        browserWsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data))
      }
      return
    }

    if (connectionIdRef.current) {
      await window.electronAPI.websocket.send(connectionIdRef.current, data)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    status,
    messages,
    connect,
    disconnect,
    send,
    clearMessages,
  }
}
