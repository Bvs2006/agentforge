import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { agentAPI } from '../services/api'
import {
  ArrowLeft, Settings, User, Bot, Send, Loader2, Paperclip, X, MessageSquare, Settings2,
  Terminal, FileText, Maximize2, Minimize2,
} from 'lucide-react'

export default function Wizard() {
  const {
    agentConfig, setAgentConfig,
    templates, selectedTemplate,
    taskInput, addNotification, user,
  } = useStore()

  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState('editor')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [doclingParsed, setDoclingParsed] = useState(null)
  const [doclingUploading, setDoclingUploading] = useState(false)
  const [chatSteps, setChatSteps] = useState([])

  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    agentAPI.getTemplates().then(() => {}).catch(() => {})
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatSteps])

  async function handleSendChatMessage() {
    if (!chatInput.trim() && !doclingParsed) return

    const messageText = doclingParsed
      ? `${chatInput}\n\n[Parsed document attachment from ${doclingParsed.filename}]`
      : chatInput

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    setChatSteps([
      { step: 1, name: 'Context Loaded', status: 'done' },
      { step: 2, name: 'AI Planner Routing', status: 'active' },
      { step: 3, name: 'Connected Tools run', status: 'idle' },
      { step: 4, name: 'Task completed', status: 'idle' },
    ])

    const payload = {
      task: messageText,
      agent_id: agentConfig.name || 'draft_agent',
      context: {
        agent_config: {
          name: agentConfig.name || 'Draft Agent',
          description: agentConfig.description || taskInput || '',
          tools: agentConfig.tools || [],
          template_id: selectedTemplate?.id || 'general_agent',
          parameters: agentConfig.parameters || {},
        },
        document_text: doclingParsed?.text || '',
        document_name: doclingParsed?.filename || '',
      },
    }

    setDoclingParsed(null)

    try {
      const stepTimer1 = setTimeout(() => {
        setChatSteps(prev =>
          prev.map(s =>
            s.step === 2
              ? { ...s, status: 'done' }
              : s.step === 3
                ? { ...s, status: 'active' }
                : s
          )
        )
      }, 1000)

      const stepTimer2 = setTimeout(() => {
        setChatSteps(prev =>
          prev.map(s =>
            s.step === 3
              ? { ...s, status: 'done' }
              : s.step === 4
                ? { ...s, status: 'active' }
                : s
          )
        )
      }, 2200)

      const res = await agentAPI.runTask(payload)

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)

      if (res.data && res.data.output) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.output,
            timestamp: new Date().toISOString(),
          },
        ])
        addNotification('Agent reply received', 'success')
      } else {
        throw new Error('Task finished without text reply')
      }
    } catch {
      addNotification('Error running draft execution pipeline', 'error')
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Pipeline execution failed. Please verify the active tools configuration on the left and check backend connection.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setChatLoading(false)
      setChatSteps([])
    }
  }

  async function handleDoclingUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setDoclingUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      addNotification(`Processing document "${file.name}"...`, 'info')
      const res = await agentAPI.uploadDoc(formData)
      setDoclingParsed({
        filename: file.name,
        text: res.data.text || '',
      })
      addNotification('Document successfully parsed', 'success')
    } catch {
      addNotification('Could not parse document', 'error')
    } finally {
      setDoclingUploading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f0f11] text-white">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-96 rounded-2xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-100"><Settings2 size={16} className="text-violet-400" /> Execution Variables</h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1.5">Max Steps</label>
                <input
                  type="number"
                  value={agentConfig.parameters?.max_steps || 5}
                  onChange={(e) => setAgentConfig({
                    ...agentConfig,
                    parameters: { ...(agentConfig.parameters || {}), max_steps: Number(e.target.value) }
                  })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5">Temperature</label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={agentConfig.parameters?.temperature || 0.2}
                  onChange={(e) => setAgentConfig({
                    ...agentConfig,
                    parameters: { ...(agentConfig.parameters || {}), temperature: Number(e.target.value) }
                  })}
                  className="w-full accent-violet-500"
                />
                <span className="text-zinc-500 mt-1 block text-right">{agentConfig.parameters?.temperature || 0.2}</span>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5">System Instructions</label>
                <textarea
                  rows={3}
                  value={agentConfig.description || ''}
                  onChange={(e) => setAgentConfig({ ...agentConfig, description: e.target.value })}
                  placeholder="You are an autonomous AI Agent..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                />
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full rounded-lg bg-violet-600 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition">Save Settings</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between px-5 border-b border-zinc-800/60 bg-[#0f0f11]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/dashboard')} className="text-zinc-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold tracking-tight text-zinc-100">Creator Studio</h1>
        </div>

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center rounded-lg bg-zinc-900 p-0.5 border border-zinc-800">
          <button
            onClick={() => setViewMode('editor')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${viewMode === 'editor' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Editor
          </button>
          <button
            onClick={() => setViewMode('app')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${viewMode === 'app' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            App
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'app' ? 'editor' : 'app')}
            className="md:hidden flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            {viewMode === 'app' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {viewMode === 'app' ? 'Sidebar' : 'Fullscreen'}
          </button>
          <button onClick={() => setShowSettings(true)} className="text-zinc-400 hover:text-zinc-200 transition" title="Settings">
            <Settings size={18} />
          </button>
          <button onClick={() => addNotification(`User: ${user?.username || 'Guest'}`, 'info')} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition" title="Account">
            <User size={16} />
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel: Config */}
        {viewMode === 'editor' && (
          <aside className="w-80 shrink-0 border-r border-zinc-800/60 bg-[#121214] flex flex-col overflow-y-auto">
            <div className="p-5 space-y-5">
              <div>
                <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Agent Config</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Name</label>
                  <input
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                    placeholder="e.g. Finance Coordinator"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Instructions</label>
                  <textarea
                    value={agentConfig.description || ''}
                    onChange={(e) => setAgentConfig({ ...agentConfig, description: e.target.value })}
                    placeholder="Describe what this agent should do..."
                    rows={8}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none transition"
                  />
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Right panel: Chat */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0f0f11]">
          <header className="h-13 border-b border-zinc-800/40 px-6 flex items-center justify-between bg-[#0f0f11]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/10 border border-violet-500/20">
                <Bot size={16} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-zinc-200">{agentConfig.name || 'Untitled Agent'}</h2>
                <p className="text-[10px] text-zinc-500">Ready</p>
              </div>
            </div>
            <button
              onClick={() => setChatMessages([])}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition"
            >
              Clear
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-24">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
                    <MessageSquare size={20} className="text-zinc-500" />
                  </div>
                  <h3 className="text-sm font-medium text-zinc-300">Start a conversation</h3>
                  <p className="text-xs text-zinc-600 mt-1.5 max-w-xs leading-relaxed">
                    Type a message below to test your agent's configuration in real time.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div key={index} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${isUser ? 'bg-violet-600/10 border-violet-500/20' : 'bg-zinc-800 border-zinc-700'}`}>
                        {isUser ? <User size={13} className="text-violet-400" /> : <Bot size={13} className="text-zinc-300" />}
                      </div>
                      <div className={`max-w-[70%] min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-zinc-900 border border-zinc-800/60 text-zinc-200 rounded-tl-sm'}`}>
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        </div>
                        <span className="text-[10px] text-zinc-600 mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}

              {chatLoading && chatSteps.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
                    <Bot size={13} className="text-zinc-300" />
                  </div>
                  <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900 p-4 max-w-sm">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 mb-3">
                      <Terminal size={11} className="text-violet-400" />
                      <span>Pipeline running</span>
                    </div>
                    <div className="space-y-2">
                      {chatSteps.map(step => (
                        <div key={step.step} className="flex items-center justify-between gap-4 text-[11px]">
                          <span className="text-zinc-400">{step.name}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${step.status === 'done' ? 'text-emerald-400 bg-emerald-500/10' : step.status === 'active' ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-600 bg-zinc-800'}`}>
                            {step.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleDoclingUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.json,.csv"
          />

          {/* Input */}
          <div className="border-t border-zinc-800/40 bg-[#0f0f11] px-6 py-4">
            <div className="mx-auto max-w-3xl">
              {doclingParsed && (
                <div className="mb-2 flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 text-xs text-violet-400">
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} /> {doclingParsed.filename} ({doclingParsed.text?.length} chars)
                  </span>
                  <button onClick={() => setDoclingParsed(null)} className="hover:text-violet-300"><X size={12} /></button>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={chatLoading || doclingUploading}
                  className="shrink-0 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {doclingUploading ? <Loader2 size={16} className="animate-spin text-violet-400" /> : <Paperclip size={16} />}
                </button>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !chatLoading) handleSendChatMessage() }}
                  placeholder="Type a message..."
                  disabled={chatLoading}
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={chatLoading || (!chatInput.trim() && !doclingParsed)}
                  className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition ${chatInput.trim() || doclingParsed ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-zinc-800 text-zinc-600'}`}
                >
                  {chatLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
