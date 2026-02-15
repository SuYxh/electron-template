import { NavLink, Outlet } from 'react-router-dom'
import '../styles/layout.less'

export default function Layout() {
  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="logo">🚀 Electron</div>
        <ul className="nav-list">
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
              🏠 首页
            </NavLink>
          </li>
          <li>
            <NavLink to="/chat" className={({ isActive }) => (isActive ? 'active' : '')}>
              💬 AI 聊天
            </NavLink>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
