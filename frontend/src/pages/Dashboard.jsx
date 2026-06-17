import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { agentAPI, platformAPI } from '../services/api'
import { Zap, Bot, Server, History, TrendingUp, Activity, Plus, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react'

const StatusDot = ({ ok }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
)

export default function Dashboard() {
  const { user, setAgents, agents, setMCPServers, mcpServers, setStatus, status } = useStore()
  const [history, setHistory] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    platformAPI.getStatus().then(r => setStatus(r.data)).catch(() => {})
    agentAPI.listAgents().then(r => setAgents(r.data)).catch(() => {})
    platformAPI.getMCPServers().then(r => setMCPServers(r.data)).catch(() => {})
    agentAPI.getHistory().then(r => setHistory(r.data.slice(-5).reverse())).catch(() => {})
  }, [])

  const stats = [
    { label: 'My Agents',    value: agents.length,                       icon: Bot,    color: 'text-ibm-blue', bg: 'bg-ibm-blue/10' },
    { label: 'MCP Servers',  value: mcpServers.length,                   icon: Server, color: 'text-ibm-purple', bg: 'bg-ibm-purple/10' },
    { label: 'Tasks Run',    value: history.filter(h=>h.role==='user').length, icon: TrendingUp, color: 'text-ibm-teal', bg: 'bg-teal-500/10' },
    { label: 'Connected',    value: mcpServers.filter(s=>s.connected).length, icon: Activity,   color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.username || 'there'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Your AI automation command center</p>
        </div>
        <button onClick={() => navigate('/run')} className="btn-primary">
          <Plus size={16} /> New Agent Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Run a new agent task', desc: 'Natural language → automation', to: '/run', icon: Zap, color: 'text-ibm-blue' },
              { label: 'Browse agent templates', desc: 'Email, GitHub, Sheets & more', to: '/run', icon: Bot, color: 'text-ibm-purple' },
              { label: 'Connect MCP servers', desc: 'Add tools & integrations', to: '/mcp', icon: Server, color: 'text-ibm-teal' },
            ].map(({ label, desc, to, icon: Icon, color }) => (
              <button key={label} onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-800/60 transition-all group text-left">
                <Icon size={16} className={color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Platform Status */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Platform Status</h2>
          {status ? (
            <div className="space-y-3">
              {Object.entries(status).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 capitalize">{k.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <StatusDot ok={v.includes('online') || v.includes('available') || v.includes('configured')} />
                    <span className="text-xs text-gray-400">{v}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {['API', 'Redis', 'Langflow', 'Granite', 'Docling'].map(s => (
                <div key={s} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{s}</span>
                  <div className="h-3 w-24 bg-gray-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Activity</h2>
          {history.length ? (
            <div className="space-y-3">
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-ibm-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                    {h.role === 'user' ? <Zap size={11} className="text-ibm-blue" /> : <Bot size={11} className="text-ibm-purple" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-300 truncate">{h.content?.slice(0, 60)}{h.content?.length > 60 ? '…' : ''}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{h.role} · {new Date(h.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-600">
              <History size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No activity yet</p>
              <button onClick={() => navigate('/run')} className="text-ibm-blue text-xs mt-2 hover:underline">Run your first task →</button>
            </div>
          )}
        </div>
      </div>

      {/* Flow Summary */}
      <div className="card mt-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">AgentForge Flow</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'User Request', color: 'bg-gray-700' },
            { label: 'Granite AI', color: 'bg-ibm-blue/30 border-ibm-blue/50' },
            { label: 'Langflow', color: 'bg-ibm-teal/20 border-teal-500/40' },
            { label: 'MCP Tools', color: 'bg-yellow-500/10 border-yellow-500/30' },
            { label: 'Docling', color: 'bg-ibm-purple/20 border-purple-500/40' },
            { label: 'Execute', color: 'bg-green-500/10 border-green-500/30' },
            { label: 'Results', color: 'bg-ibm-blue/20 border-ibm-blue/40' },
          ].map(({ label, color }, i, arr) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-300 ${color}`}>{label}</div>
              {i < arr.length - 1 && <ArrowRight size={14} className="text-gray-600" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
