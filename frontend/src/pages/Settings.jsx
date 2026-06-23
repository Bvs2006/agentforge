import { useStore } from '../hooks/useStore'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Sparkles, Shield } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout } = useStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0e1014] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-zinc-400 mt-1">Your account information</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ibm-blue to-ibm-purple flex items-center justify-center text-white text-xl font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.username || 'User'}</h2>
              <p className="text-sm text-zinc-400">{user?.email || ''}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-zinc-950/60 border border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <User size={16} className="text-zinc-500" />
                <span className="text-sm text-zinc-400">Username</span>
              </div>
              <span className="text-sm">{user?.username || '-'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-950/60 border border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-zinc-500" />
                <span className="text-sm text-zinc-400">Email</span>
              </div>
              <span className="text-sm">{user?.email || '-'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 mb-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-ibm-blue" />
            About AgentForge
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            AgentForge lets you create AI assistants from your documents, websites, code repositories, and data files.
            Each assistant has its own knowledge base and can answer questions about your content.
          </p>
          <p className="text-xs text-zinc-600 mt-3">Version 1.0.0</p>
        </div>

        <button
          onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 px-5 py-3 text-sm text-red-400 hover:bg-red-950/40 transition w-full justify-center"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
