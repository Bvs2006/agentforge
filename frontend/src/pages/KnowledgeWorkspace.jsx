import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { knowledgeAPI } from '../services/api'
import {
  Brain, Plus, FileText, Globe, Folder, Table, Bot,
  Search, CheckCircle2, AlertCircle, Loader2, ArrowRight,
  BookOpen, Code, ExternalLink, Clock, Database, Zap,
} from 'lucide-react'

const sourceIcons = {
  document: FileText,
  repository: Code,
  website: Globe,
  spreadsheet: Table,
  folder: Folder,
}

export default function KnowledgeWorkspace() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      knowledgeAPI.listAgents(),
      knowledgeAPI.getStatus(),
    ])
      .then(([agentsRes, statusRes]) => {
        setAgents(agentsRes.data || [])
        setStatus(statusRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-violet-400 mb-1">
              <Brain size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider">Knowledge Workspace</span>
            </div>
            <h1 className="text-2xl font-bold">Knowledge Agents</h1>
            <p className="text-sm text-zinc-400 mt-1">Create AI chatbots from your documents, code, and data sources</p>
          </div>
          <button
                  onClick={() => navigate('/app/knowledge/new')}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus size={16} />
            Create Knowledge Agent
          </button>
        </div>

        {status && (
          <div className="flex gap-3 mb-8 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
              <Database size={14} className="text-emerald-400" />
              <span className="text-zinc-400">Embeddings:</span>
              <span className={status.embeddings === 'available' ? 'text-green-400' : 'text-yellow-400'}>
                {status.embeddings}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
              <Zap size={14} className="text-purple-400" />
              <span className="text-zinc-400">Vector Store:</span>
              <span className="text-green-400">{status.vector_store}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-violet-400" size={24} />
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
              <Brain size={32} className="text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No Knowledge Agents yet</h2>
            <p className="text-sm text-zinc-400 mb-6 max-w-md">
              Create your first Knowledge Agent by uploading documents, connecting a repository,
              or scraping a website. Each agent gets its own vector knowledge base and chat interface.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {[
                { icon: FileText, label: 'From Documents', desc: 'PDF, DOCX, TXT, MD' },
                { icon: Code, label: 'From Repository', desc: 'GitHub, GitLab, local' },
                { icon: Globe, label: 'From Website', desc: 'Docs, blogs, sites' },
                { icon: Table, label: 'From Spreadsheet', desc: 'CSV, Excel files' },
              ].map(item => (
                <button
                  key={item.label}
            onClick={() => navigate('/app/knowledge/new')}
                  className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 text-center hover:border-violet-500/50 hover:bg-violet-600/5 transition group"
                >
                  <item.icon size={24} className="text-zinc-500 group-hover:text-violet-400 transition" />
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="text-[10px] text-zinc-500">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map(agent => (
              <div
                key={agent.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 hover:border-violet-500/40 transition group cursor-pointer"
                onClick={() => navigate(`/knowledge/${agent.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                      <Bot size={20} className="text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{agent.name}</h3>
                      <p className="text-[10px] text-zinc-500">{agent.source_ids?.length || 0} sources</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-zinc-600 group-hover:text-violet-400 transition" />
                </div>
                {agent.description && (
                  <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{agent.description}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <Clock size={12} />
                  <span>{new Date(agent.created_at).toLocaleDateString()}</span>
                  {agent.memory_enabled && (
                    <>
                      <span className="text-zinc-700">|</span>
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Memory</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
