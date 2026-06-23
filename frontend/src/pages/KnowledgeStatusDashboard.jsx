import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { knowledgeAPI } from '../services/api'
import {
  Brain, Loader2, CheckCircle2, AlertCircle, Clock,
  Database, Zap, Layers, Activity, Bot, FileText,
  Globe, Code, Table, RefreshCw, ArrowRight,
} from 'lucide-react'

export default function KnowledgeStatusDashboard() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [agentStatuses, setAgentStatuses] = useState({})

  const loadData = () => {
    setLoading(true)
    Promise.all([
      knowledgeAPI.listAgents(),
      knowledgeAPI.getStatus(),
    ])
      .then(([agentsRes, statusRes]) => {
        setAgents(agentsRes.data || [])
        setStatus(statusRes.data)
        const agentIds = (agentsRes.data || []).map(a => a.id)
        return Promise.allSettled(
          agentIds.map(id =>
            knowledgeAPI.getAgentStatus(id).then(r => ({ id, status: r.data }))
          )
        )
      })
      .then((results) => {
        const statusMap = {}
        results.forEach(r => {
          if (r.status === 'fulfilled') statusMap[r.value.id] = r.value.status
        })
        setAgentStatuses(statusMap)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const totalChunks = Object.values(agentStatuses).reduce((a, s) => a + (s.total_chunks || 0), 0)
  const readyAgents = Object.values(agentStatuses).filter(s => s.status === 'ready').length
  const totalSources = Object.values(agentStatuses).reduce((a, s) => a + (s.sources_count || 0), 0)

  if (loading) return <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center"><Loader2 className="animate-spin text-violet-400" size={24} /></div>

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-violet-400 mb-1">
              <Activity size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Knowledge Status</span>
            </div>
            <h1 className="text-2xl font-bold">System Dashboard</h1>
          </div>
          <button onClick={loadData} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Bot, label: 'Knowledge Agents', value: agents.length, color: 'text-violet-400' },
            { icon: CheckCircle2, label: 'Ready Agents', value: readyAgents, color: 'text-green-400' },
            { icon: Layers, label: 'Total Chunks', value: totalChunks, color: 'text-purple-400' },
            { icon: Database, label: 'Total Sources', value: totalSources, color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="text-xs text-zinc-500">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {status && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 mb-8">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap size={14} className="text-violet-400" /> Services
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Embeddings', value: status.embeddings, ok: status.embeddings === 'available' },
                { label: 'Vector Store', value: status.vector_store, ok: true },
                { label: 'Document Ingestion', value: 'Ready', ok: status.ingestion?.documents },
                { label: 'Web Ingestion', value: 'Ready', ok: status.ingestion?.websites },
              ].map(svc => (
                <div key={svc.label} className="flex items-center gap-2 rounded-lg bg-zinc-950/60 border border-zinc-800 px-3 py-2">
                  {svc.ok ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertCircle size={12} className="text-yellow-500" />}
                  <span className="text-xs text-zinc-400">{svc.label}</span>
                  <span className="text-[10px] ml-auto text-zinc-500">{svc.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
          <h2 className="text-sm font-semibold mb-4">Agent Details</h2>
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No knowledge agents created yet</p>
          ) : (
            <div className="space-y-2">
              {agents.map(agent => {
                const as = agentStatuses[agent.id] || {}
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 cursor-pointer hover:border-zinc-600 transition"
                    onClick={() => navigate(`/knowledge/${agent.id}`)}
                  >
                    <Bot size={16} className="text-violet-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{agent.name}</p>
                      <p className="text-[10px] text-zinc-500">{as.sources_count || 0} sources &middot; {as.total_chunks || 0} chunks</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {as.status === 'ready' ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-400"><CheckCircle2 size={10} /> Ready</span>
                      ) : as.sources_failed > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} /> {as.sources_failed} failed</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-400"><Loader2 size={10} className="animate-spin" /> Processing</span>
                      )}
                      <ArrowRight size={14} className="text-zinc-600" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
