import { useEffect, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { agentAPI } from '../services/api'
import { History, Trash2, User, Bot, Search } from 'lucide-react'

export default function HistoryPage() {
  const { addNotification } = useStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    agentAPI.getHistory()
      .then(r => setHistory(r.data.reverse()))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const clearAll = async () => {
    if (!confirm('Clear all conversation history?')) return
    try {
      await agentAPI.clearHistory()
      setHistory([])
      addNotification('History cleared', 'info')
    } catch {
      addNotification('Could not clear history', 'error')
    }
  }

  const filtered = history.filter(h =>
    !search || h.content?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-gray-400 text-sm mt-1">{history.length} messages in conversation history</p>
        </div>
        {history.length > 0 && (
          <button onClick={clearAll} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-950/30">
            <Trash2 size={15} /> Clear All
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Search history…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse flex gap-3">
              <div className="w-7 h-7 bg-gray-800 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-gray-800 rounded w-1/4 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-full mb-1" />
                <div className="h-4 bg-gray-800 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <History size={32} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500">{search ? 'No results found' : 'No history yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg, i) => (
            <div key={i} className={`flex gap-3 p-4 rounded-xl border transition-all ${
              msg.role === 'user'
                ? 'border-gray-800 bg-gray-900/40'
                : 'border-ibm-blue/15 bg-ibm-blue/5'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === 'user' ? 'bg-gray-800' : 'bg-ibm-blue/15'
              }`}>
                {msg.role === 'user'
                  ? <User size={13} className="text-gray-400" />
                  : <Bot size={13} className="text-ibm-blue" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-gray-400' : 'text-ibm-blue'}`}>
                    {msg.role === 'user' ? 'You' : 'AgentForge'}
                  </span>
                  <span className="text-xs text-gray-600">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
                  </span>
                  {msg.task_id && (
                    <span className="badge bg-gray-800 text-gray-600 border border-gray-700 font-mono">
                      #{msg.task_id.slice(0, 8)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {msg.content?.length > 400 ? msg.content.slice(0, 400) + '…' : msg.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
