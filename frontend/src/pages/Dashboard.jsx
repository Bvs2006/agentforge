import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { agentAPI, knowledgeAPI } from '../services/api'
import {
  Bot, Brain, Plus, Sparkles, Clock,
  MessageSquare, FileText, Globe, Code, Table,
  ArrowRight, CheckCircle2, Star, Wand2,
} from 'lucide-react'

export default function Dashboard() {
  const { user, setAgents, agents, addNotification } = useStore()
  const [knowledgeAgents, setKnowledgeAgents] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      agentAPI.listAgents().then(r => setAgents(r.data)).catch(() => {}),
      knowledgeAPI.listAgents().then(r => setKnowledgeAgents(r.data || [])).catch(() => {}),
      agentAPI.getHistory().then(r => setHistory(r.data.slice(-5).reverse())).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const totalAgents = agents.length + knowledgeAgents.length
  const recentMessages = history.filter(m => m.role === 'user').length

  return (
    <div className="min-h-screen bg-[#0e1014] text-white p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-ibm-blue mb-1">
              <Sparkles size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.username || 'there'}</h1>
            <p className="text-sm text-zinc-400 mt-1">Create AI assistants that answer questions using your documents and data</p>
          </div>
          <button
            onClick={() => navigate('/app/knowledge/new')}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus size={16} />
            New Knowledge Agent
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Bot, label: 'Your Agents', value: totalAgents, desc: 'AI assistants you created', color: 'text-ibm-blue', bg: 'bg-ibm-blue/10 border-ibm-blue/20' },
            { icon: Brain, label: 'Knowledge Agents', value: knowledgeAgents.length, desc: 'Built from your files', color: 'text-ibm-purple', bg: 'bg-ibm-purple/10 border-ibm-purple/20' },
            { icon: MessageSquare, label: 'Conversations', value: recentMessages, desc: 'Questions you asked', color: 'text-ibm-teal', bg: 'bg-ibm-teal/10 border-ibm-teal/20' },
            { icon: FileText, label: 'Files Processed', value: knowledgeAgents.reduce((a, k) => a + (k.source_ids?.length || 0), 0), desc: 'Documents, repos, sites', color: 'text-ibm-cyan', bg: 'bg-ibm-cyan/10 border-ibm-cyan/20' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl border ${stat.bg} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={20} className={stat.color} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{stat.label}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{stat.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/app/knowledge')}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-left hover:border-ibm-blue/50 hover:bg-ibm-blue/5 transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center mb-3">
              <Brain size={20} className="text-ibm-blue" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Knowledge Agents</h3>
            <p className="text-xs text-zinc-400 mb-3">Create AI chatbots from PDFs, websites, code repos, and spreadsheets</p>
            <div className="flex items-center gap-1 text-xs text-ibm-blue group-hover:gap-2 transition-all">
              <span>Open workspace</span>
              <ArrowRight size={12} />
            </div>
          </button>

          <button
            onClick={() => navigate('/app/agents')}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-left hover:border-ibm-purple/50 hover:bg-ibm-purple/5 transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-ibm-purple/10 border border-ibm-purple/20 flex items-center justify-center mb-3">
              <Bot size={20} className="text-ibm-purple" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Agent Templates</h3>
            <p className="text-xs text-zinc-400 mb-3">Start with ready-made templates for common tasks and workflows</p>
            <div className="flex items-center gap-1 text-xs text-ibm-purple group-hover:gap-2 transition-all">
              <span>Browse templates</span>
              <ArrowRight size={12} />
            </div>
          </button>

          <button
            onClick={() => navigate('/app/run')}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-left hover:border-ibm-cyan/50 hover:bg-ibm-cyan/5 transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-ibm-cyan/10 border border-ibm-cyan/20 flex items-center justify-center mb-3">
              <Wand2 size={20} className="text-ibm-cyan" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Creator Studio</h3>
            <p className="text-xs text-zinc-400 mb-3">Build custom AI agents with a visual wizard and step-by-step guidance</p>
            <div className="flex items-center gap-1 text-xs text-ibm-cyan group-hover:gap-2 transition-all">
              <span>Open studio</span>
              <ArrowRight size={12} />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Star size={14} className="text-ibm-blue" />
              Quick Start
            </h2>
            <div className="space-y-2">
              {[
                { icon: FileText, label: 'Upload a PDF', desc: 'Create an agent from a document',         to: '/app/knowledge/new', color: 'text-ibm-blue' },
                { icon: Globe, label: 'Add a website', desc: 'Index a documentation site', to: '/app/knowledge/new', color: 'text-ibm-teal' },
                { icon: Code, label: 'Connect a repository', desc: 'Add a GitHub or local codebase', to: '/app/knowledge/new', color: 'text-ibm-purple' },
                { icon: Table, label: 'Import a spreadsheet', desc: 'Use CSV or Excel as knowledge', to: '/app/knowledge/new', color: 'text-ibm-cyan' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className="flex items-center gap-3 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-left hover:border-zinc-600 transition"
                >
                  <item.icon size={16} className={item.color} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{item.label}</div>
                    <div className="text-[10px] text-zinc-500">{item.desc}</div>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock size={14} className="text-ibm-blue" />
              Recent Activity
            </h2>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare size={20} className="text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-500">No activity yet</p>
                <p className="text-[10px] text-zinc-600 mt-1">Start by creating a knowledge agent and asking a question</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg p-2 hover:bg-zinc-900/40 transition cursor-pointer"
                    onClick={() => {
                      if (item.agent_id) navigate(item.agent_id.startsWith('kb_') ? `/app/knowledge/${item.agent_id}` : `/app/chat/${item.agent_id}`)
                    }}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${item.role === 'user' ? 'bg-ibm-blue/10' : 'bg-zinc-800'}`}>
                      {item.role === 'user' ? (
                        <MessageSquare size={10} className="text-ibm-blue" />
                      ) : (
                        <Bot size={10} className="text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate text-zinc-300">{item.content?.slice(0, 80)}</p>
                      <p className="text-[9px] text-zinc-600 mt-0.5">
                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {knowledgeAgents.length > 0 && (
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Brain size={14} className="text-ibm-blue" />
              Your Knowledge Agents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {knowledgeAgents.slice(0, 6).map(agent => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 cursor-pointer hover:border-zinc-600 transition"
                  onClick={() => navigate(`/app/knowledge/${agent.id}`)}
                >
                  <div className="w-8 h-8 rounded-lg bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center">
                    <Bot size={14} className="text-ibm-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{agent.name}</p>
                    <p className="text-[10px] text-zinc-500">{agent.source_ids?.length || 0} sources</p>
                  </div>
                  <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
