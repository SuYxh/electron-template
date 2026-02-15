import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../shared/constants/channels'
import type { ChatMessage } from '../../../shared/types/chat'

let abortController: AbortController | null = null

export function registerChatHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEND,
    async (event, { messages, apiKey }: { messages: ChatMessage[]; apiKey: string }) => {
      if (!apiKey) {
        return { success: false, error: '请先设置 API Key' }
      }

      const window = BrowserWindow.fromWebContents(event.sender)
      if (!window) {
        return { success: false, error: '窗口未找到' }
      }

      abortController = new AbortController()

      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMsg = (errorData as { error?: { message?: string } }).error?.message || `HTTP ${response.status}`
          window.webContents.send(IPC_CHANNELS.CHAT_ERROR, { error: errorMsg })
          return { success: false, error: errorMsg }
        }

        const reader = response.body?.getReader()
        if (!reader) {
          return { success: false, error: '无法读取响应流' }
        }

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
              const content = json.choices?.[0]?.delta?.content || ''
              if (content) {
                window.webContents.send(IPC_CHANNELS.CHAT_CHUNK, {
                  content,
                  done: false,
                })
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        window.webContents.send(IPC_CHANNELS.CHAT_CHUNK, { content: '', done: true })
        return { success: true }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return { success: true, aborted: true }
        }
        const errorMsg = (error as Error).message
        window.webContents.send(IPC_CHANNELS.CHAT_ERROR, { error: errorMsg })
        return { success: false, error: errorMsg }
      } finally {
        abortController = null
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.CHAT_STOP, async () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    return { success: true }
  })
}
