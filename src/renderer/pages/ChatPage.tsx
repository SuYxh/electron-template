import { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import '../styles/chat.less'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, error, sendMessage, stopGeneration, clearMessages } = useChat()

  useEffect(() => {
    const savedKey = localStorage.getItem('deepseek_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('deepseek_api_key', apiKey.trim())
      setShowApiKeyInput(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    
    if (!apiKey.trim()) {
      setShowApiKeyInput(true)
      return
    }

    const userMessage = input.trim()
    setInput('')
    await sendMessage(userMessage, apiKey)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>💬 AI 聊天</h1>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            title="设置 API Key"
          >
            ⚙️
          </button>
          <button className="icon-btn" onClick={clearMessages} title="清空对话">
            🗑️
          </button>
        </div>
      </div>

      {showApiKeyInput && (
        <div className="api-key-panel">
          <div className="api-key-input-wrapper">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入 DeepSeek API Key"
              className="api-key-input"
            />
            <button onClick={handleSaveApiKey} className="save-btn">
              保存
            </button>
          </div>
          <p className="api-key-hint">
            API Key 将保存在本地，不会上传到服务器
          </p>
        </div>
      )}

      {!apiKey && !showApiKeyInput && (
        <div className="api-key-warning">
          ⚠️ 请先设置 API Key 才能使用聊天功能
          <button onClick={() => setShowApiKeyInput(true)}>设置</button>
        </div>
      )}

      {error && <div className="error-message">❌ {error}</div>}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <p>开始和 AI 对话吧！</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <pre>{msg.content || (isLoading && msg.role === 'assistant' ? '思考中...' : '')}</pre>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={apiKey ? '输入消息，按 Enter 发送...' : '请先设置 API Key'}
          disabled={isLoading || !apiKey}
          rows={1}
        />
        {isLoading ? (
          <button className="stop-btn" onClick={stopGeneration}>
            ⏹️ 停止
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || !apiKey}
          >
            发送 ➤
          </button>
        )}
      </div>
    </div>
  )
}
