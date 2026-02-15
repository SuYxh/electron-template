export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface ChatRequest {
  messages: ChatMessage[]
  apiKey: string
}

export interface ChatChunk {
  content: string
  done: boolean
}

export interface ChatConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

export const defaultChatConfig: ChatConfig = {
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048,
}
