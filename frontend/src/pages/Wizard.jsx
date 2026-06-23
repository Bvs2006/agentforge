import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { agentAPI } from '../services/api'
import {
  ArrowLeft, Bot, Send, Loader2, Paperclip, X,
  FileText, User, Settings2, MessageSquare, Trash2,
} from 'lucide-react'

export default function Wizard() {
  const { agentConfig, setAgentConfig, addNotification, user } = useStore()
  const navigate = useNavigate()
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [doclingParsed, setDoclingParsed] = useState(null)
  const [doclingUploading, setDoclingUploading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleSend() {
    if (!chatInput.trim() && !doclingParsed) return

    const text = doclingParsed
      ? `${chatInput}\n\n[Attached document: ${doclingParsed.filename}]`
      : chatInput

    setChatMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }])
    setChatInput('')
    setChatLoading(true)

    const payload = {
      task: text,
      agent_id: agentConfig.name || 'draft_agent',
      context: {
        agent_config: {
          name: agentConfig.name || 'Draft Agent',
          description: agentConfig.description || '',
          tools: agentConfig.tools || [],
          template_id: 'general_agent',
          parameters: agentConfig.parameters || {},
        },
        document_text: doclingParsed?.text || '',
        document_name: doclingParsed?.filename || '',
      },
    }

    setDoclingParsed(null)

    try {
      const res = await agentAPI.runTask(payload)
      if (res.data?.output) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.output, timestamp: new Date().toISOString() }])
      } else {
        throw new Error('No output')
      }
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error running your request. Check the tools configuration and try again.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setChatLoading(false)
    }
  }

  async function handleDocUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setDoclingUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await agentAPI.uploadDoc(fd)
      setDoclingParsed({ filename: file.name, text: res.data.text || '' })
      addNotification('Document parsed', 'success')
    } catch {
      addNotification('Could not parse document', 'error')
    } finally {
      setDoclingUploading(false)
    }
  }

  function toggleTool(tool) {
    const current = agentConfig.tools || []
    setAgentConfig({
      ...agentConfig,
      tools: current.includes(tool) ? current.filter(t => t !== tool) : [...current, tool],
    })
  }

  const tools = ['gmail_mcp', 'github_mcp', 'google_sheets_mcp', 'filesystem_mcp', 'slack_mcp']

  return (
    <div className="flex h-screen flex-col bg-[#0e1014] text-white">
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 w-96 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5"><Settings2 size={16} className="text-ibm-blue" /> Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Max Steps</label>
                <input type="number" value={agentConfig.parameters?.max_steps || 5}
                  onChange={e => setAgentConfig({ ...agentConfig, parameters: { ...(agentConfig.parameters || {}), max_steps: Number(e.target.value) } })}
                  className="input" />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Temperature</label>
                <input type="range" min="0" max="1" step="0.1"
                  value={agentConfig.parameters?.temperature || 0.2}
                  onChange={e => setAgentConfig({ ...agentConfig, parameters: { ...(agentConfig.parameters || {}), temperature: Number(e.target.value) } })}
                  className="w-full accent-ibm-blue" />
                <span className="text-zinc-500 mt-1 block text-right">{agentConfig.parameters?.temperature || 0.2}</span>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">System Instructions</label>
                <textarea rows={3} value={agentConfig.description || ''}
                  onChange={e => setAgentConfig({ ...agentConfig, description: e.target.value })}
                  placeholder="You are an autonomous AI Agent..."
                  className="input resize-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="flex h-12 shrink-0 items-center justify-between px-4 border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/dashboard')} className="text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold">Creator Studio</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="text-zinc-500 hover:text-white p-1.5" title="Settings">
            <Settings2 size={16} />
          </button>
          <button onClick={() => addNotification(`User: ${user?.username || 'Guest'}`, 'info')} className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400" title="Account">
            <User size={14} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <aside className="w-full xl:w-72 border-b xl:border-b-0 xl:border-r border-zinc-800 bg-zinc-950/20 p-5 space-y-5 overflow-y-auto shrink-0">
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Agent Config</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Name</label>
                <input value={agentConfig.name || ''}
                  onChange={e => setAgentConfig({ ...agentConfig, name: e.target.value })}
                  placeholder="e.g. Finance Agent" className="input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Instructions</label>
                <textarea value={agentConfig.description || ''}
                  onChange={e => setAgentConfig({ ...agentConfig, description: e.target.value })}
                  placeholder="What should this agent do?" rows={4} className="input resize-none text-xs" />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1.5">Tools</label>
                <div className="flex flex-wrap gap-1.5">
                  {tools.map(tool => {
                    const active = (agentConfig.tools || []).includes(tool)
                    return (
                      <button key={tool} onClick={() => toggleTool(tool)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${
                          active ? 'border-ibm-blue bg-ibm-blue/10 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}>
                        {tool.replace('_mcp', '')}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-zinc-500">
              <span>Max Steps</span>
              <span className="text-zinc-300 font-medium">{agentConfig.parameters?.max_steps || 5}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Temperature</span>
              <span className="text-zinc-300 font-medium">{agentConfig.parameters?.temperature || 0.2}</span>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0">
          <header className="h-11 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950/30">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <MessageSquare size={14} className="text-ibm-blue" />
              <span>Chat with your agent</span>
            </div>
            <button onClick={() => setChatMessages([])} className="text-xs text-zinc-600 hover:text-white flex items-center gap-1">
              <Trash2 size={12} /> Clear
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-3">
                  <Bot size={18} className="text-ibm-blue" />
                </div>
                <h2 className="text-xs font-semibold text-zinc-300">Ready</h2>
                <p className="text-[11px] text-zinc-600 mt-1">Configure your agent on the left and send a message to test it.</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center shrink-0">
                        <Bot size={14} className="text-ibm-blue" />
                      </div>
                    )}
                    <div className={`max-w-[75%] min-w-0 ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <div className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                        msg.role === 'user'
                          ? 'bg-ibm-blue border-ibm-blue/40 text-white rounded-tr-none'
                          : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-200 rounded-tl-none'
                      }`}>
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      </div>
                      <span className="text-[9px] text-zinc-600 mt-1 block px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-ibm-blue/15 border border-ibm-blue/25 flex items-center justify-center shrink-0">
                        <User size={14} className="text-ibm-blue" />
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center">
                      <Bot size={14} className="text-ibm-blue" />
                    </div>
                    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/60 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Loader2 className="animate-spin" size={14} />
                        <span>Running agent...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} onChange={handleDocUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,.json,.csv" />

          <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 shrink-0">
            <div className="max-w-3xl mx-auto">
              {doclingParsed && (
                <div className="mb-2 flex items-center justify-between rounded-lg border border-ibm-teal/30 bg-ibm-teal/5 px-3 py-1 text-xs text-ibm-teal">
                  <span className="flex items-center gap-1.5"><FileText size={12} /> {doclingParsed.filename}</span>
                  <button onClick={() => setDoclingParsed(null)} className="text-ibm-teal hover:text-teal-300"><X size={12} /></button>
                </div>
              )}
              <div className="relative flex items-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-1 pr-2 focus-within:ring-1 focus-within:ring-ibm-blue focus-within:border-transparent">
                <button onClick={() => fileInputRef.current?.click()} disabled={chatLoading || doclingUploading}
                  className="p-1.5 text-zinc-500 hover:text-white">
                  {doclingUploading ? <Loader2 className="animate-spin text-ibm-teal" size={16} /> : <Paperclip size={16} />}
                </button>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !chatLoading) handleSend() }}
                  placeholder={doclingUploading ? 'Parsing...' : 'Type a message...'}
                  disabled={chatLoading}
                  className="flex-1 bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0 px-2 py-1.5" />
                <button onClick={handleSend}
                  disabled={chatLoading || (!chatInput.trim() && !doclingParsed)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg transition ${
                    chatInput.trim() || doclingParsed ? 'bg-ibm-blue hover:bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}>
                  {chatLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
