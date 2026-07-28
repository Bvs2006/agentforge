import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import {
  LayoutDashboard, Bot, Brain, Sparkles,
  Wand2, ChevronRight,
} from 'lucide-react'
import Notifications from './Notifications'

const sections = [
  {
    label: 'Tools',
    items: [
      { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/agents',    icon: Bot,             label: 'Agent Builder' },
      { to: '/app/run',       icon: Wand2,           label: 'Creator Studio' },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { to: '/app/knowledge', icon: Brain, label: 'Knowledge Agents' },
    ],
  },
]

export default function Layout() {
  const { username } = useStore()
  const location = useLocation()
  const fullScreen = location.pathname === '/app/run' || location.pathname.startsWith('/app/chat/') || location.pathname.startsWith('/app/knowledge/')

  return (
    <div className="flex h-screen overflow-hidden">
      {fullScreen ? (
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      ) : (
        <>
      <aside className="w-60 flex flex-col bg-gray-950 border-r border-gray-800/60 shrink-0">
        <div className="px-5 py-5 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">AgentForge</p>
              <p className="text-gray-500 text-xs">AI Assistant Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/app/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                        isActive
                          ? 'bg-violet-600/15 text-violet-400 border border-violet-500/25'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                      }`
                    }
                  >
                    <Icon size={16} />
                    {label}
                    <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-gray-800/60 pt-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
              {username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{username || 'User'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
        </>
      )}

      <Notifications />
    </div>
  )
}
