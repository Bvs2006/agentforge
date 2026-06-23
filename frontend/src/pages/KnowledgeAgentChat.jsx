import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { knowledgeAPI } from '../services/api'
import {
  Brain, Bot, Send, Loader2, User, ArrowLeft, FileText,
  Globe, Code, Table, BookOpen, MessageSquare, Trash2,
  CheckCircle2, AlertCircle, Clock, Search, ExternalLink,
} from 'lucide-react'

const sourceTypeMeta = {
  document: { icon: FileText, color: 'text-ibm-blue' },
  repository: { icon: Code, color: 'text-ibm-purple' },
  website: { icon: Globe, color: 'text-ibm-teal' },
  spreadsheet: { icon: Table, color: 'text-ibm-cyan' },
}

export default function KnowledgeAgentChat() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [sources, setSources] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentLoading, setAgentLoading] = useState(true)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!agentId) return
    Promise.all([
      knowledgeAPI.getAgent(agentId),
      knowledgeAPI.listSources(agentId),
    ])
      .then(([agentRes, sourcesRes]) => {
        setAgent(agentRes.data)
        setSources(sourcesRes.data || [])
      })
      .catch(() => navigate('/app/knowledge'))
      .finally(() => setAgentLoading(false))
  }, [agentId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await knowledgeAPI.chat(agentId, { question: userMsg.content, top_k: 5 })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources || [],
        task_id: res.data.task_id,
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  if (agentLoading) {
    return (
      <div className="min-h-screen bg-[#0e1014] flex items-center justify-center">
        <Loader2 className="animate-spin text-ibm-blue" size={24} />
      </div>
    )
  }

  if (!agent) return null

  const completedSources = sources.filter(s => s.status === 'completed')
  const failedSources = sources.filter(s => s.status === 'failed')

  return (
    <div className="flex h-screen bg-[#0e1014] text-white">
      <aside className="w-72 border-r border-zinc-800 bg-zinc-950/40 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <button onClick={() => navigate('/app/knowledge')} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-3">
            <ArrowLeft size={14} />
            Knowledge Workspace
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center">
              <Bot size={18} className="text-ibm-blue" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">{agent.name}</h2>
              <p className="text-[10px] text-zinc-500">Knowledge Agent</p>
            </div>
          </div>
        </div>

        {agent.description && (
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-[11px] text-zinc-400 leading-relaxed">{agent.description}</p>
          </div>
        )}

        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Sources ({sources.length})</h3>
          <div className="space-y-1.5">
            {sources.map(source => {
              const meta = sourceTypeMeta[source.type] || { icon: FileText, color: 'text-zinc-400' }
              return (
                <div key={source.id} className="flex items-center gap-2 text-[11px]">
                  <meta.icon size={12} className={meta.color} />
                  <span className="flex-1 truncate">{source.name}</span>
                  {source.status === 'completed' ? (
                    <CheckCircle2 size={10} className="text-green-500" />
                  ) : source.status === 'failed' ? (
                    <AlertCircle size={10} className="text-red-500" />
                  ) : (
                    <Loader2 size={10} className="animate-spin text-yellow-500" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Stats</h3>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-2 text-center">
              <div className="text-ibm-blue font-bold">{completedSources.length}</div>
              <div className="text-zinc-500 text-[9px]">Sources Ready</div>
            </div>
            <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-2 text-center">
              <div className="text-ibm-teal font-bold">{sources.reduce((a, s) => a + (s.chunks_count || 0), 0)}</div>
              <div className="text-zinc-500 text-[9px]">Chunks</div>
            </div>
          </div>
        </div>

        <div className="p-4 mt-auto">
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <Brain size={12} />
            <span>RAG-powered answers</span>
          </div>
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-5 bg-zinc-950/30">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <MessageSquare size={14} className="text-ibm-blue" />
            <span>Ask anything about your knowledge base</span>
          </div>
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center mb-4">
                <Brain size={24} className="text-ibm-blue" />
              </div>
              <h2 className="text-base font-semibold mb-2">{agent.name}</h2>
              <p className="text-sm text-zinc-400 mb-6">
                I have knowledge from {sources.length} source(s). Ask me anything about your data.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                {[
                  'What are the key points from my documents?',
                  'Summarize the main topics in my knowledge base',
                  'Find information related to...',
                  'What files are in my repository?',
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt) }}
                    className="text-left rounded-lg border border-zinc-800 bg-zinc-950/30 px-4 py-2.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-ibm-blue" />
                    </div>
                  )}

                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                      msg.role === 'user'
                        ? 'bg-ibm-blue border-ibm-blue/40 text-white rounded-tr-none'
                        : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-200 rounded-tl-none'
                    }`}>
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <BookOpen size={10} />
                          <span>Sources</span>
                        </div>
                        {msg.sources.map((src, si) => (
                          <div key={si} className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-zinc-950/40 rounded px-2 py-1">
                            {src.source_type === 'website' ? <Globe size={10} className="text-ibm-teal" /> :
                             src.source_type === 'repository' ? <Code size={10} className="text-ibm-purple" /> :
                             <FileText size={10} className="text-ibm-blue" />}
                            <span className="truncate">{src.filename || src.source_type}</span>
                            <span className="ml-auto opacity-50">{(src.score * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <span className="text-[9px] text-zinc-600 mt-1 block px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-ibm-blue/15 border border-ibm-blue/25 flex items-center justify-center shrink-0">
                      <User size={16} className="text-ibm-blue" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center">
                    <Bot size={16} className="text-ibm-blue" />
                  </div>
                  <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="animate-spin" size={14} />
                      <span>Searching knowledge base...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) handleSend() }}
              placeholder="Ask a question about your knowledge base..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-ibm-blue transition"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-10 w-10 rounded-xl bg-ibm-blue flex items-center justify-center disabled:opacity-40 hover:bg-blue-600 transition"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
