import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import './styles/global.less'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
