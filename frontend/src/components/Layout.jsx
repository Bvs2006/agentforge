import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { useEffect } from 'react'
import { authAPI } from '../services/api'
import {
  LayoutDashboard, Bot, Zap, Server, History,
  Settings, LogOut, ChevronRight, Bell
} from 'lucide-react'
import Notifications from './Notifications'

const nav = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents',  icon: Bot,             label: 'Agent Builder' },
  { to: '/run',     icon: Zap,             label: 'Run Task' },
  { to: '/mcp',     icon: Server,          label: 'MCP Workspace' },
  { to: '/history', icon: History,         label: 'History' },
  { to: '/settings',icon: Settings,        label: 'Settings' },
]

export default function Layout() {
  const { user, setUser, logout, token, notifications } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user && token) {
      authAPI.me().then(r => setUser(r.data)).catch(() => {})
    }
  }, [token])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col bg-gray-950 border-r border-gray-800/60 shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ibm-blue to-ibm-purple flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">AgentForge</p>
              <p className="text-gray-500 text-xs">IBM AI Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-ibm-blue/15 text-ibm-blue border border-ibm-blue/25'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`
              }
            >
              <Icon size={16} />
              {label}
              <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-gray-800/60 pt-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ibm-blue to-ibm-purple flex items-center justify-center text-white text-xs font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <Notifications />
    </div>
  )
}
