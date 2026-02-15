import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChatMessage } from '../../shared/types/chat'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!isElectron) return

    const unsubChunk = window.electronAPI.chat.onChunk((_, data) => {
      const { content, done } = data as { content: string; done: boolean }
      
      if (done) {
        setIsLoading(false)
        return
      }

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg && lastMsg.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + content },
          ]
        }
        return prev
      })
    })

    const unsubError = window.electronAPI.chat.onError((_, data) => {
      const { error: errMsg } = data as { error: string }
      setError(errMsg)
      setIsLoading(false)
    })

    return () => {
      unsubChunk()
      unsubError()
    }
  }, [])

  const sendMessage = useCallback(async (content: string, apiKey: string) => {
    setError(null)
    
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setIsLoading(true)

    if (isElectron) {
      const allMessages = [...messages, userMessage]
      await window.electronAPI.chat.send(allMessages, apiKey)
    } else {
      abortControllerRef.current = new AbortController()
      
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            (errorData as { error?: { message?: string } }).error?.message || `HTTP ${response.status}`
          )
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('无法读取响应流')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (!trimmed.startsWith('data: ')) continue

            try {
              const json = JSON.parse(trimmed.slice(6))
              const chunk = json.choices?.[0]?.delta?.content || ''
              if (chunk) {
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1]
                  if (lastMsg && lastMsg.role === 'assistant') {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMsg, content: lastMsg.content + chunk },
                    ]
                  }
                  return prev
                })
              }
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message)
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [messages])

  const stopGeneration = useCallback(async () => {
    if (isElectron) {
      await window.electronAPI.chat.stop()
    } else if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearMessages,
  }
}
