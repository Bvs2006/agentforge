import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { agentAPI } from '../services/api'
import {
  ArrowLeft,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react'

const CATEGORY_THEMES = {
  communication: {
    badge: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
    gradient: 'from-sky-600/20 via-transparent to-transparent',
    border: 'border-sky-500/30',
    text: 'text-sky-300',
    accent: 'bg-sky-500 hover:bg-sky-600',
    bubble: 'bg-sky-950/40 border-sky-900/30 text-sky-100',
  },
  development: {
    badge: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
    gradient: 'from-violet-600/20 via-transparent to-transparent',
    border: 'border-violet-500/30',
    text: 'text-violet-300',
    accent: 'bg-violet-500 hover:bg-violet-600',
    bubble: 'bg-violet-950/40 border-violet-900/30 text-violet-100',
  },
  productivity: {
    badge: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    gradient: 'from-cyan-600/20 via-transparent to-transparent',
    border: 'border-cyan-500/30',
    text: 'text-cyan-300',
    accent: 'bg-cyan-500 hover:bg-cyan-600',
    bubble: 'bg-cyan-950/40 border-cyan-900/30 text-cyan-100',
  },
  data: {
    badge: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-600/20 via-transparent to-transparent',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    accent: 'bg-emerald-500 hover:bg-emerald-600',
    bubble: 'bg-emerald-950/40 border-emerald-900/30 text-emerald-100',
  },
  research: {
    badge: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    gradient: 'from-amber-600/20 via-transparent to-transparent',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    accent: 'bg-amber-500 hover:bg-amber-600',
    bubble: 'bg-amber-950/40 border-amber-900/30 text-amber-100',
  },
  general: {
    badge: 'text-gray-300 bg-gray-500/10 border-gray-600',
    gradient: 'from-gray-600/15 via-transparent to-transparent',
    border: 'border-gray-700/50',
    text: 'text-gray-300',
    accent: 'bg-ibm-blue hover:bg-blue-700',
    bubble: 'bg-gray-900/50 border-gray-800 text-gray-100',
  },
  custom: {
    badge: 'text-ibm-blue bg-ibm-blue/10 border-ibm-blue/25',
    gradient: 'from-ibm-blue/20 via-transparent to-transparent',
    border: 'border-ibm-blue/30',
    text: 'text-ibm-blue',
    accent: 'bg-ibm-blue hover:bg-blue-700',
    bubble: 'bg-blue-950/30 border-blue-900/20 text-blue-100',
  },
}

const STARTER_PROMPTS = {
  email_agent: [
    'Draft a summary email about our project timeline',
    'Find emails with urgent action items from today',
    'Send an update to the team with release details',
  ],
  github_agent: [
    'Summarize recent issues in the repository',
    'List all open pull requests and their assignees',
    'Create an issue report for a UI bug',
  ],
  document_agent: [
    'Analyze the uploaded PDF document and outline key points',
    'Extract action items and deadlines from this file',
    'Compare the text with standard policies',
  ],
  sheets_agent: [
    'Read the recent sheet data and calculate total sales',
    'Add a new row with registration data',
    'Summarize the data trend from our table',
  ],
  research_agent: [
    'Search the web for the latest updates on Watsonx AI',
    'Compile a summary of research on no-code AI platforms',
    'Find and synthesize information about MCP integrations',
  ],
  general_agent: [
    'Help me automate my daily summary task',
    'Create a project plan outline',
    'Analyze this task request and suggest tools',
  ],
}

export default function ChatPlayground() {
  const { agentName } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useStore()

  const [agent, setAgent] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsedDoc, setParsedDoc] = useState(null)
  const [activeSteps, setActiveSteps] = useState([])
  const [loadingAgent, setLoadingAgent] = useState(true)

  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Determine theme based on template category
  const theme = agent
    ? CATEGORY_THEMES[agent.template_id?.replace('_agent', '')] || CATEGORY_THEMES.general
    : CATEGORY_THEMES.general

  const starters = agent
    ? STARTER_PROMPTS[agent.template_id] || STARTER_PROMPTS.general_agent
    : STARTER_PROMPTS.general_agent

  useEffect(() => {
    async function loadData() {
      setLoadingAgent(true)
      try {
        const agentRes = await agentAPI.listAgents()
        const found = agentRes.data.find(a => a.name === agentName)
        if (found) {
          setAgent(found)
          // Load chat history for this agent specifically
          const historyRes = await agentAPI.getHistory(found.name)
          setMessages(historyRes.data)
        } else {
          addNotification(`Agent "${agentName}" not found`, 'error')
          navigate('/app/agents')
        }
      } catch (err) {
        addNotification('Error loading agent playground', 'error')
      } finally {
        setLoadingAgent(false)
      }
    }
    loadData()
  }, [agentName])

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeSteps, isLoading])

  async function handleSend(textToSend) {
    if (!textToSend.trim() && !parsedDoc) return

    const userMessageText = parsedDoc
      ? `${textToSend}\n\n[Attached document contents from ${parsedDoc.filename}]`
      : textToSend

    // Append user message immediately
    const tempUserMsg = {
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString(),
      agent_id: agentName,
    }
    setMessages(prev => [...prev, tempUserMsg])
    setInput('')
    setIsLoading(true)

    // Setup temporary live steps monitor
    setActiveSteps([
      { step: 1, name: 'Context Loaded', status: 'done' },
      { step: 2, name: 'Planning & Tool Routing', status: 'active' },
      { step: 3, name: 'MCP execution', status: 'idle' },
      { step: 4, name: 'Generating Answer', status: 'idle' },
    ])

    const payload = {
      task: userMessageText,
      agent_id: agent.name,
      context: parsedDoc
        ? {
            document_name: parsedDoc.filename,
            document_text: parsedDoc.text,
          }
        : {},
    }

    // Reset document state
    setParsedDoc(null)

    try {
      // Simulate step increments
      const stepTimer1 = setTimeout(() => {
        setActiveSteps(prev =>
          prev.map(s =>
            s.step === 2
              ? { ...s, status: 'done' }
              : s.step === 3
                ? { ...s, status: 'active' }
                : s
          )
        )
      }, 1500)

      const stepTimer2 = setTimeout(() => {
        setActiveSteps(prev =>
          prev.map(s =>
            s.step === 3
              ? { ...s, status: 'done' }
              : s.step === 4
                ? { ...s, status: 'active' }
                : s
          )
        )
      }, 3000)

      const res = await agentAPI.runTask(payload)

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)

      if (res.data && res.data.output) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.output,
            timestamp: new Date().toISOString(),
            agent_id: agentName,
          },
        ])
        addNotification('Response received', 'success')
      } else {
        throw new Error('No output returned')
      }
    } catch (err) {
      addNotification('Error running agent task', 'error')
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ An error occurred while orchestrating this agent. Please verify your MCP tool settings or server logs.',
          timestamp: new Date().toISOString(),
          agent_id: agentName,
        },
      ])
    } finally {
      setIsLoading(false)
      setActiveSteps([])
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      addNotification(`Uploading and parsing "${file.name}" via IBM Docling...`, 'info')
      const res = await agentAPI.uploadDoc(formData)
      setParsedDoc({
        filename: file.name,
        text: res.data.text || '',
      })
      addNotification('Document successfully parsed', 'success')
    } catch {
      addNotification('Could not process document via Docling', 'error')
    } finally {
      setUploading(false)
    }
  }

  function handleClearChat() {
    if (confirm('Clear local chat visual history?')) {
      setMessages([])
      addNotification('Conversation cleared locally', 'info')
    }
  }

  if (loadingAgent) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-950 text-gray-400">
        <Loader2 className="animate-spin text-ibm-blue mb-4" size={36} />
        <p className="text-sm font-medium">Entering agent playground...</p>
      </div>
    )
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-gray-950 text-gray-100`}>
      {/* LEFT SIDEBAR: Agent Configuration & Details */}
      <aside className={`w-80 border-r border-gray-800 bg-gray-950 flex flex-col shrink-0 overflow-y-auto`}>
        {/* Header/Back */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <button
            onClick={() => navigate('/app/agents')}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={16} /> Back to Studio
          </button>
          <span className={`badge ${theme.badge} border`}>{agent.template_id?.replace('_agent', '')}</span>
        </div>

        <div className="p-5 flex-1 space-y-6">
          {/* Brand/Vibe Header */}
          <div className="relative rounded-xl border border-gray-800 bg-gray-900/40 p-4 overflow-hidden">
            <div className={`absolute top-0 left-0 h-full w-20 bg-gradient-to-r ${theme.gradient} blur-xl opacity-80`} />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center">
                <Bot className={theme.text} size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white truncate">{agent.name}</h2>
                <p className="text-[11px] text-gray-500">Opal AI Agent</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">{agent.description || 'Custom chatbot agent.'}</p>
          </div>

          {/* Configuration Stats */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Agent Configuration</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-900 bg-gray-950 p-2 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5"><Wrench size={12} /> MCP Tools</span>
                <span className="font-semibold text-gray-200">{(agent.tools || []).length} active</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-900 bg-gray-950 p-2 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5"><Terminal size={12} /> Execution Flow</span>
                <span className="font-semibold text-gray-200">Langflow</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-900 bg-gray-950 p-2 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5"><Clock size={12} /> Max Steps</span>
                <span className="font-semibold text-gray-200">{agent.parameters?.max_steps || 5} steps</span>
              </div>
            </div>
          </div>

          {/* Tools List */}
          {agent.tools && agent.tools.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Available Tools</h3>
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.map(tool => (
                  <span
                    key={tool}
                    className="badge bg-gray-900 text-gray-300 border border-gray-800 flex items-center gap-1"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-ibm-teal" />
                    {tool.replace('_mcp', '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Starter Prompts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Starter Prompts</h3>
            <div className="space-y-2">
              {starters.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => setInput(promptText)}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-800 bg-gray-900/30 text-xs text-gray-400 hover:text-white hover:border-gray-700 transition"
                >
                  "{promptText}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-800 text-[11px] text-gray-600 flex items-center justify-between bg-gray-950">
          <span className="flex items-center gap-1"><Calendar size={11} /> Configured:</span>
          <span>{agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'Active'}</span>
        </div>
      </aside>

      {/* RIGHT MAIN PLAYGROUND AREA */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#0f1115] relative">
        {/* Header */}
        <header className="h-[60px] border-b border-gray-800 px-6 flex items-center justify-between bg-gray-950/80 backdrop-blur shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className={theme.text} size={22} />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-gray-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">{agent.name}</h1>
              <p className="text-[10px] text-gray-500">Live Agent Play Session</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="btn-ghost text-xs py-1.5 px-3 border border-gray-800 bg-gray-900/30 hover:bg-gray-800/40 text-gray-400 hover:text-white"
            >
              <Trash2 size={13} /> Clear Chat
            </button>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className={`w-12 h-12 rounded-2xl bg-gray-950 border border-gray-800 flex items-center justify-center mb-4 ${theme.text} animate-bounce`}>
                <MessageSquare size={22} />
              </div>
              <h2 className="text-sm font-semibold text-gray-200">Start conversing with {agent.name}</h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Click a starter prompt or type your query below. The agent will interpret your intent, orchestrate tools via MCP, and complete the action.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot Avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center shrink-0">
                        <Bot size={15} className={theme.text} />
                      </div>
                    )}

                    <div className="max-w-[75%] min-w-0">
                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed border shadow-sm ${
                          isUser
                            ? 'bg-ibm-blue border-ibm-blue/40 text-white rounded-tr-none'
                            : 'bg-gray-900/70 border-gray-800/60 text-gray-200 rounded-tl-none'
                        }`}
                      >
                        {/* Render simple newlines and bolding */}
                        <div className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[10px] text-gray-600 mt-1 block px-1.5">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-ibm-blue/15 border border-ibm-blue/25 flex items-center justify-center shrink-0">
                        <User size={15} className="text-ibm-blue" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Active Steps Progress Indicator */}
          {isLoading && activeSteps.length > 0 && (
            <div className="max-w-4xl mx-auto pl-12 space-y-3">
              <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 max-w-lg shadow-xl animate-pulse">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-3">
                  <Terminal size={14} className={theme.text} />
                  <span>Agent Execution Trace</span>
                </div>
                <div className="space-y-2">
                  {activeSteps.map(step => {
                    const statusColor =
                      step.status === 'done'
                        ? 'text-green-400 bg-green-500/10 border-green-500/20'
                        : step.status === 'active'
                          ? 'text-ibm-blue bg-ibm-blue/10 border-ibm-blue/20'
                          : 'text-gray-600 bg-gray-950 border-gray-900'

                    return (
                      <div key={step.step} className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 font-medium">
                          {step.step}. {step.name}
                        </span>
                        <span className={`badge border ${statusColor} text-[10px]`}>
                          {step.status === 'active' && 'running'}
                          {step.status === 'done' && 'completed'}
                          {step.status === 'idle' && 'pending'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.json,.csv"
        />

        {/* Input Bar */}
        <div className="p-4 bg-gray-950/40 border-t border-gray-800 shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Parsed document details */}
            {parsedDoc && (
              <div className="mb-2 flex items-center justify-between rounded-lg border border-ibm-teal/30 bg-ibm-teal/5 px-3 py-1.5 text-xs text-ibm-teal">
                <span className="flex items-center gap-1.5 font-medium">
                  <FileText size={14} /> Attached: {parsedDoc.filename} (+{parsedDoc.text?.length || 0} parsed characters)
                </span>
                <button
                  onClick={() => setParsedDoc(null)}
                  className="text-ibm-teal hover:text-teal-300"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input elements */}
            <div className="relative flex items-center rounded-xl border border-gray-850 bg-gray-900/60 p-1.5 pr-2 focus-within:ring-2 focus-within:ring-ibm-blue/50 focus-within:border-transparent transition-all">
              <button
                type="button"
                disabled={isLoading || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost p-2 text-gray-500 hover:text-white hover:bg-gray-800/50"
                title="Attach Document via IBM Docling"
              >
                {uploading ? (
                  <Loader2 className="animate-spin text-ibm-teal" size={18} />
                ) : (
                  <Paperclip size={18} />
                )}
              </button>

              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !isLoading) handleSend(input)
                }}
                disabled={isLoading}
                placeholder={
                  uploading
                    ? 'Docling parsing document...'
                    : `Message ${agent.name}...`
                }
                className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-0 px-2 py-2"
              />

              <button
                onClick={() => handleSend(input)}
                disabled={isLoading || (!input.trim() && !parsedDoc)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  input.trim() || parsedDoc
                    ? `${theme.accent} text-white`
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">
              AgentForge utilizes IBM Granite & Langflow routing to map natural language prompts to live tools.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
