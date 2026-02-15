import { useState } from 'react'
import { useNotification } from '../hooks/useNotification'
import { useWebSocket } from '../hooks/useWebSocket'
import '../styles/home.less'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export default function HomePage() {
  const [count, setCount] = useState(0)
  const { showNotification } = useNotification()
  const { status, connect, disconnect, send } = useWebSocket()

  const handleNotification = () => {
    showNotification({
      title: '测试通知',
      body: `这是一条测试通知，当前计数：${count}`,
    })
  }

  const handleWebSocketTest = async () => {
    if (status === 'connected') {
      send({ type: 'ping', timestamp: Date.now() })
    } else {
      await connect({ url: 'wss://echo.websocket.org' })
    }
  }

  const handleStoreTest = async () => {
    if (!isElectron) {
      console.log('[Browser Mode] Store operations require Electron environment')
      const testData = { value: count, timestamp: Date.now() }
      localStorage.setItem('testKey', JSON.stringify(testData))
      console.log('Stored to localStorage:', testData)
      return
    }

    try {
      await window.electronAPI.store.set('testKey', { value: count, timestamp: Date.now() })
      const result = await window.electronAPI.store.get('testKey')
      console.log('Store result:', result)
    } catch (error) {
      console.error('Store error:', error)
    }
  }

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>🚀 Electron Template</h1>
        <p className="subtitle">React + Vite + TypeScript</p>
        {!isElectron && (
          <p className="env-badge">🌐 浏览器模式 (部分功能受限)</p>
        )}
      </header>

      <div className="cards">
        <section className="card">
          <h2>基础功能</h2>
          <div className="counter">
            <button onClick={() => setCount((c) => c - 1)}>-</button>
            <span className="count">{count}</span>
            <button onClick={() => setCount((c) => c + 1)}>+</button>
          </div>
        </section>

        <section className="card">
          <h2>模块测试</h2>
          <div className="button-group">
            <button onClick={handleNotification}>📢 发送通知</button>
            <button onClick={handleWebSocketTest}>
              🔌 WebSocket ({status})
            </button>
            {status === 'connected' && (
              <button onClick={disconnect}>断开连接</button>
            )}
          </div>
        </section>

        <section className="card">
          <h2>数据存储</h2>
          <div className="button-group">
            <button onClick={handleStoreTest}>📦 Store 测试</button>
          </div>
        </section>
      </div>
    </div>
  )
}
