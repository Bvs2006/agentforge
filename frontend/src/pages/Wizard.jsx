import { useEffect, useMemo, useState, useRef } from 'react'
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
    taskInput, isRunning, addNotification, user,
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
    agentAPI.getTemplates().then(response => {}).catch(() => {})
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#171717] text-white">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="card w-96 p-6 space-y-4 border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5"><Settings2 size={16} /> Execution Variables</h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Max Steps</label>
                <input
                  type="number"
                  value={agentConfig.parameters?.max_steps || 5}
                  onChange={(e) => setAgentConfig({
                    ...agentConfig,
                    parameters: { ...(agentConfig.parameters || {}), max_steps: Number(e.target.value) }
                  })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Temperature</label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={agentConfig.parameters?.temperature || 0.2}
                  onChange={(e) => setAgentConfig({
                    ...agentConfig,
                    parameters: { ...(agentConfig.parameters || {}), temperature: Number(e.target.value) }
                  })}
                  className="w-full accent-ibm-blue"
                />
                <span className="text-zinc-500 mt-1 block text-right">val: {agentConfig.parameters?.temperature || 0.2}</span>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">System Instructions</label>
                <textarea
                  rows={3}
                  value={agentConfig.description || ''}
                  onChange={(e) => setAgentConfig({ ...agentConfig, description: e.target.value })}
                  placeholder="You are an autonomous AI Agent..."
                  className="input resize-none"
                />
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="btn-primary w-full text-xs py-2 justify-center">Save Settings</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between bg-[#242424] px-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/dashboard')} className="text-zinc-200 hover:text-white" title="Back">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold">Creator Studio</h1>
        </div>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center rounded-full bg-black p-0.5 text-sm font-bold border border-zinc-800">
          <button
            onClick={() => setViewMode('editor')}
            className={`rounded-full px-4 py-1.5 transition ${viewMode === 'editor' ? 'border border-indigo-400 bg-indigo-500/20 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Editor
          </button>
          <button
            onClick={() => setViewMode('app')}
            className={`rounded-full px-4 py-1.5 transition ${viewMode === 'app' ? 'border border-indigo-400 bg-indigo-500/20 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            App
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'app' ? 'editor' : 'app')}
            className="md:hidden flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs border border-zinc-800 text-zinc-300 hover:text-white"
            title={viewMode === 'app' ? 'Show sidebar' : 'Full screen chat'}
          >
            {viewMode === 'app' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {viewMode === 'app' ? 'Sidebar' : 'Fullscreen'}
          </button>
          <button onClick={() => setShowSettings(true)} className="text-zinc-300 hover:text-white" title="Settings">
            <Settings size={22} />
          </button>
          <button onClick={() => addNotification(`User session: ${user?.username || 'Guest'}`, 'info')} className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-zinc-500" title="Account">
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Main: Left config + Right chat */}
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row bg-[#0e1014]">
        {/* Left panel: Config editor (hidden in App mode) */}
        {viewMode === 'editor' && (
          <aside className="w-full xl:w-80 border-b xl:border-b-0 xl:border-r border-zinc-800 bg-[#161920] p-5 space-y-5 flex flex-col overflow-y-auto">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">Agent Config</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Agent Name</label>
                <input
                  value={agentConfig.name}
                  onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                  placeholder="e.g. Finance Coordinator"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Instructions</label>
                <textarea
                  value={agentConfig.description || ''}
                  onChange={(e) => setAgentConfig({ ...agentConfig, description: e.target.value })}
                  placeholder="Describe details, roles, rules, and outcomes..."
                  rows={6}
                  className="input resize-none"
                />
              </div>
            </div>
          </aside>
        )}

        {/* Right panel: Chat */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0b0c10] relative">
          <header className="h-[52px] border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot size={20} />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-zinc-950" />
              </div>
              <div>
                <h1 className="text-xs font-bold text-white">{agentConfig.name || 'Draft Agent'}</h1>
                <p className="text-[9px] text-zinc-500">Live Config Playground</p>
              </div>
            </div>
            <button
              onClick={() => setChatMessages([])}
              className="btn-secondary text-xs px-2.5 py-1 bg-zinc-900 border-zinc-800 text-zinc-400"
            >
              Clear Chat
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-3">
                  <MessageSquare size={18} />
                </div>
                <h2 className="text-xs font-semibold text-zinc-300">Playground session initialized</h2>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Type a task command below. The execution runner will parse it on the fly using your draft prompt rules and tools list.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {chatMessages.map((msg, index) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div key={index} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                          <Bot size={14} />
                        </div>
                      )}
                      <div className="max-w-[75%] min-w-0">
                        <div className={`rounded-xl px-4 py-2.5 text-xs leading-relaxed border ${isUser ? 'bg-ibm-blue border-ibm-blue/40 text-white rounded-tr-none' : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-200 rounded-tl-none'}`}>
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        </div>
                        <span className="text-[9px] text-zinc-600 mt-1 block px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-ibm-blue/15 border border-ibm-blue/25 flex items-center justify-center shrink-0">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Running trace */}
            {chatLoading && chatSteps.length > 0 && (
              <div className="max-w-3xl mx-auto pl-10 space-y-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 max-w-sm shadow-xl animate-pulse">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300 mb-2">
                    <Terminal size={12} />
                    <span>Pipeline execution log</span>
                  </div>
                  <div className="space-y-1.5">
                    {chatSteps.map(step => (
                      <div key={step.step} className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">{step.step}. {step.name}</span>
                        <span className={`badge border text-[8px] ${step.status === 'done' ? 'text-green-400 bg-green-500/10 border-green-500/20' : step.status === 'active' ? 'text-ibm-blue bg-ibm-blue/10 border-ibm-blue/20' : 'text-zinc-600 border-zinc-850 bg-zinc-950'}`}>
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

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleDoclingUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.json,.csv"
          />

          {/* Input */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-950/40 shrink-0">
            <div className="max-w-3xl mx-auto">
              {doclingParsed && (
                <div className="mb-2 flex items-center justify-between rounded-lg border border-teal-400/30 bg-teal-400/5 px-3 py-1 text-xs text-teal-400">
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} /> Attached: {doclingParsed.filename} (+{doclingParsed.text?.length} chars)
                  </span>
                  <button onClick={() => setDoclingParsed(null)} className="hover:text-teal-300">
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="relative flex items-center rounded-xl border border-zinc-800 bg-[#161821] p-1 pr-2 focus-within:ring-1 focus-within:ring-ibm-blue focus-within:border-transparent">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={chatLoading || doclingUploading}
                  className="p-1.5 text-zinc-500 hover:text-white"
                  title="Process document"
                >
                  {doclingUploading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Paperclip size={16} />
                  )}
                </button>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !chatLoading) handleSendChatMessage()
                  }}
                  placeholder={doclingUploading ? 'Parsing document...' : 'Send test query to draft agent...'}
                  disabled={chatLoading}
                  className="flex-1 bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-0 px-2 py-1.5"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={chatLoading || (!chatInput.trim() && !doclingParsed)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${chatInput.trim() || doclingParsed ? 'bg-ibm-blue hover:bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                >
                  {chatLoading ? (
                    <Loader2 className="animate-spin" size={12} />
                  ) : (
                    <Send size={12} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
