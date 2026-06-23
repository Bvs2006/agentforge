import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { agentAPI } from '../services/api'
import StepDescribeTask from '../components/wizard/StepDescribeTask'
import StepChooseTemplate from '../components/wizard/StepChooseTemplate'
import StepConfigureAgent from '../components/wizard/StepConfigureAgent'
import StepVisualizeWorkflow from '../components/wizard/StepVisualizeWorkflow'
import StepRunMonitor from '../components/wizard/StepRunMonitor'
import StepViewResults from '../components/wizard/StepViewResults'
import {
  ArrowLeft,
  CornerUpLeft,
  CornerUpRight,
  DownloadCloud,
  Menu,
  Minus,
  Plus,
  RotateCcw,
  Settings,
  Share2,
  Shuffle,
  User,
  WandSparkles,
  Workflow,
  ZoomIn,
  Bot,
  Send,
  Wrench,
  Loader2,
  Paperclip,
  X,
  MessageSquare,
  Trash2,
  Settings2,
  CheckCircle2,
  Terminal,
  FileText,
  Sliders,
} from 'lucide-react'

const TABS = ['Describe', 'Template', 'Config', 'Graph', 'Run', 'Output']

const STEP_COMPONENTS = [
  StepDescribeTask,
  StepChooseTemplate,
  StepConfigureAgent,
  StepVisualizeWorkflow,
  StepRunMonitor,
  StepViewResults,
]

const toneStyles = {
  input: 'border-violet-500/30 bg-gray-800/80 text-violet-200',
  process: 'border-blue-500/25 bg-gray-800/80 text-blue-200',
  audio: 'border-amber-500/25 bg-gray-800/80 text-amber-200',
  output: 'border-emerald-500/25 bg-gray-800/80 text-emerald-200',
}

function truncate(value, fallback) {
  const text = (value || fallback || '').trim()
  return text.length > 78 ? `${text.slice(0, 75)}...` : text
}

function titleFromPrompt(prompt) {
  const cleaned = prompt
    .replace(/^(build|create|make|an agent that|agent that|a workflow that)\s+/i, '')
    .replace(/[^a-z0-9 ]/gi, ' ')
    .trim()

  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 4)
  if (!words.length) return 'Generated Agent'
  return words.map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}

function pickTemplate(templates, prompt) {
  const text = prompt.toLowerCase()
  const rules = [
    { keys: ['email', 'gmail', 'inbox'], ids: ['email_agent'] },
    { keys: ['github', 'repo', 'issue', 'pull request', 'pr'], ids: ['github_agent'] },
    { keys: ['pdf', 'document', 'docling', 'file', 'report'], ids: ['document_agent'] },
    { keys: ['sheet', 'spreadsheet', 'table', 'csv'], ids: ['sheets_agent'] },
    { keys: ['research', 'search', 'latest', 'summarize'], ids: ['research_agent'] },
  ]

  const match = rules.find(rule => rule.keys.some(key => text.includes(key)))
  if (match) {
    const found = templates.find(template => match.ids.includes(template.id))
    if (found) return found
  }

  return templates.find(template => template.id === 'general_agent') || templates[0] || null
}

function getWorkflowNodes({ taskInput, selectedTemplate, agentConfig, currentStep, taskResult, isRunning }) {
  const tools = selectedTemplate?.tools || []
  return [
    {
      id: 'describe',
      step: 0,
      title: 'Task Input',
      body: truncate(taskInput, 'Describe what the agent should automate'),
      tone: 'input',
      x: 8,
      y: 38,
    },
    {
      id: 'template',
      step: 1,
      title: 'AI Planner',
      body: selectedTemplate ? `${selectedTemplate.name} template` : 'Select the best-fit agent model template',
      tone: 'process',
      x: 30,
      y: 58,
    },
    {
      id: 'configure',
      step: 2,
      title: 'Agent Config',
      body: agentConfig.name
        ? `${agentConfig.name} - ${agentConfig.parameters?.max_steps || 5} max steps`
        : 'Configure agent rules and runtime execution variables',
      tone: 'process',
      x: 45,
      y: 34,
    },
    {
      id: 'tools',
      step: 3,
      title: 'Connected Tools',
      body: tools.length ? `${tools.join(', ')} with file parsers` : 'Manage workspace tools and document attachments',
      tone: 'audio',
      x: 61,
      y: 49,
    },
    {
      id: 'run',
      step: 4,
      title: isRunning ? 'Agent Running' : 'Run Agent',
      body: isRunning ? 'Active pipeline execution in progress' : 'Submit the workspace parameters and trigger runner',
      tone: 'audio',
      x: 76,
      y: 34,
    },
    {
      id: 'results',
      step: 5,
      title: 'Task Output',
      body: taskResult?.output ? truncate(taskResult.output, 'Review output') : 'Review execution metrics and save finished agent',
      tone: 'output',
      x: 76,
      y: 62,
    },
  ]
}

const EDGES = [
  ['describe', 'template'],
  ['template', 'configure'],
  ['configure', 'tools'],
  ['tools', 'run'],
  ['run', 'results'],
]

function CanvasNode({ node, active, done, onClick }) {
  const headerClass = node.tone === 'input'
    ? 'bg-lime-200 text-gray-950'
    : node.tone === 'output'
      ? 'bg-emerald-200 text-gray-950'
      : 'bg-violet-100 text-gray-950'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute w-44 rounded-md border text-left shadow-2xl shadow-black/30 transition hover:-translate-y-0.5 ${
        toneStyles[node.tone]
      } ${active ? 'ring-2 ring-violet-500/40' : ''} ${done ? 'opacity-100' : 'opacity-85'}`}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <div className={`flex h-7 items-center gap-2 rounded-t-md px-2 text-[10px] font-semibold ${headerClass}`}>
        <Menu size={10} />
        <span className="truncate">{node.title}</span>
        <span className={`ml-auto h-2 w-2 rounded-full border border-current ${done ? 'bg-current' : ''}`} />
      </div>
      <p className="min-h-14 px-3 py-2 text-[10px] leading-relaxed text-gray-100">{node.body}</p>
    </button>
  )
}

function nodeCenter(nodes, id) {
  const node = nodes.find(item => item.id === id)
  return {
    x: node.x + 7,
    y: node.y + 5,
  }
}

function WorkflowCanvas({ nodes, currentStep, setStep, zoomScale, setZoomScale, addNotification }) {
  return (
    <div className="relative h-full min-h-[560px] overflow-hidden bg-[#0f0f11]">
      <div 
        className="absolute inset-0 transition-transform duration-200"
        style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {EDGES.map(([fromId, toId]) => {
            const from = nodeCenter(nodes, fromId)
            const to = nodeCenter(nodes, toId)
            const mid = (from.x + to.x) / 2
            return (
              <path
                key={`${fromId}-${toId}`}
                d={`M ${from.x} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                stroke="rgba(209, 213, 219, 0.55)"
                strokeDasharray="4 3"
                strokeWidth="0.16"
              />
            )
          })}
        </svg>

        {nodes.map(node => (
          <CanvasNode
            key={node.id}
            node={node}
            active={node.step === currentStep}
            done={node.step < currentStep}
            onClick={() => setStep(node.step)}
          />
        ))}
      </div>

      <div className="absolute bottom-8 right-8 flex w-12 flex-col overflow-hidden rounded-3xl bg-zinc-800/95 text-zinc-300 shadow-2xl z-20">
        <button 
          onClick={() => { setZoomScale(1.0); addNotification('Canvas view fit to screen', 'info') }} 
          className="flex h-12 items-center justify-center hover:bg-zinc-700" 
          title="Fit"
        >
          <ZoomIn size={17} />
        </button>
        <button 
          onClick={() => setZoomScale(z => Math.min(z + 0.15, 1.6))} 
          className="flex h-10 items-center justify-center hover:bg-zinc-700" 
          title="Zoom in"
        >
          <Plus size={16} />
        </button>
        <button 
          onClick={() => setZoomScale(z => Math.max(z - 0.15, 0.5))} 
          className="flex h-10 items-center justify-center hover:bg-zinc-700" 
          title="Zoom out"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={() => addNotification('Undo canvas edit', 'info')} 
          className="flex h-10 items-center justify-center border-t border-white/10 hover:bg-zinc-700" 
          title="Undo"
        >
          <CornerUpLeft size={16} />
        </button>
        <button 
          onClick={() => addNotification('Redo canvas edit', 'info')} 
          className="flex h-10 items-center justify-center hover:bg-zinc-700" 
          title="Redo"
        >
          <CornerUpRight size={16} />
        </button>
      </div>
    </div>
  )
}

function MakerPrompt({ value, setValue, onGenerate }) {
  const examples = [
    'an agent that researches a topic and creates a brief',
    'an agent that reads a PDF and extracts action items',
    'an agent that summarizes repository issues and drafts an update',
  ]

  return (
    <div className="mb-4 rounded-2xl border border-zinc-800/30 bg-zinc-950/55 p-4 shadow-2xl">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <WandSparkles size={16} className="text-violet-400" />
        Build with AI Assistant
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3">
        <span className="hidden text-sm text-zinc-500 sm:inline">Build</span>
        <input
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onGenerate()
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          placeholder="an agent that automates workspace research and tool routing..."
        />
        <button onClick={onGenerate} className="btn-primary shrink-0 px-3 py-2 text-xs">
          Generate
        </button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {examples.map(example => (
          <button
            key={example}
            onClick={() => setValue(example)}
            className="shrink-0 rounded-full border border-zinc-800/30 bg-violet-950/30 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-violet-900/40"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  )
}

function PreviewPanel({ currentStep, setStep, makerPrompt, setMakerPrompt, onGenerate }) {
  const StepComponent = STEP_COMPONENTS[currentStep] || StepDescribeTask

  return (
    <aside className="flex min-h-0 w-full flex-col bg-[#121214] text-zinc-200 xl:w-[34rem] 2xl:w-[42rem]">
      <div className="flex h-[70px] items-center gap-2 overflow-x-auto border-b border-zinc-800/20 px-6">
        {TABS.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setStep(index)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              index === currentStep ? 'bg-zinc-800/80 text-zinc-300' : 'text-zinc-600/70 hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex h-[68px] items-center justify-between border-b border-zinc-800/20 px-6">
        <Menu size={28} className="text-violet-400/80" />
        <div className="h-1.5 w-48 rounded-full bg-zinc-950/70">
          <div className="h-full w-1/3 rounded-full bg-violet-400" />
        </div>
        <RotateCcw size={30} className="text-violet-400/70" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <MakerPrompt value={makerPrompt} setValue={setMakerPrompt} onGenerate={onGenerate} />
        <div className="rounded-2xl border border-zinc-800/30 bg-zinc-950/45 p-5 shadow-2xl backdrop-blur">
          <StepComponent />
        </div>
      </div>
    </aside>
  )
}

export default function Wizard() {
  const {
    currentStep,
    setStep,
    setTemplates,
    resetWizard,
    taskInput,
    setTaskInput,
    templates,
    selectedTemplate,
    setSelectedTemplate,
    agentConfig,
    setAgentConfig,
    taskResult,
    isRunning,
    addNotification,
    user,
  } = useStore()

  const [makerPrompt, setMakerPrompt] = useState('')
  const [viewMode, setViewMode] = useState('editor') // 'editor' | 'app'
  const [zoomScale, setZoomScale] = useState(1.0)
  const [showSettings, setShowSettings] = useState(false)

  // App mode: Chat state
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
    resetWizard()
    agentAPI.getTemplates().then(response => setTemplates(response.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!makerPrompt && taskInput) setMakerPrompt(taskInput)
  }, [taskInput, makerPrompt])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatSteps])

  function generateAgentFromPrompt() {
    const prompt = makerPrompt.trim()
    if (prompt.length < 8) {
      addNotification('Describe the agent you want to build first', 'error')
      return
    }

    const template = pickTemplate(templates, prompt)
    const name = titleFromPrompt(prompt)

    setTaskInput(prompt)
    if (template) setSelectedTemplate(template)
    setAgentConfig({
      name,
      description: `Custom model plan parsed from: ${prompt}`,
      tools: template?.tools || [],
      parameters: {
        max_steps: 5,
        verbosity: 'normal',
        generated_by: 'opal_style_builder',
      },
    })
    setStep(template ? 3 : 1)
    addNotification('Generated draft agent configuration workflow', 'success')
  }

  const nodes = useMemo(
    () => getWorkflowNodes({ taskInput, selectedTemplate, agentConfig, currentStep, taskResult, isRunning }),
    [taskInput, selectedTemplate, agentConfig, currentStep, taskResult, isRunning],
  )

  const publishLabel = useMemo(() => {
    if (currentStep >= 4) return 'Ready'
    if (currentStep >= 2) return 'Drafting'
    return 'AI Stack'
  }, [currentStep])

  // Functional Remix Prompt
  function handleRemix() {
    const prompts = [
      'Create an agent that scans our filesystem for data updates and formats tables',
      'Make a Slack coordinator agent that forwards urgent emails to specific channels',
      'Build a codebase auditor that checks pull requests for security vulnerabilities',
      'Assemble a market research agent that searches the web and drafts detailed reviews',
    ]
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    setMakerPrompt(randomPrompt)
    addNotification('Remixed creator prompt draft!', 'info')
  }

  async function handleShare() {
    const mockLink = `${window.location.origin}/chat/${agentConfig.name || 'new_agent'}`
    try {
      await navigator.clipboard.writeText(mockLink)
      addNotification('Share link copied to clipboard!', 'success')
    } catch {
      addNotification('Could not copy link', 'error')
    }
  }

  // Workable App Chat logic
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

    // Setup visual workflow steps
    setChatSteps([
      { step: 1, name: 'Context Loaded', status: 'done' },
      { step: 2, name: 'AI Planner Routing', status: 'active' },
      { step: 3, name: 'Connected Tools run', status: 'idle' },
      { step: 4, name: 'Task completed', status: 'idle' },
    ])

    // Construct fully custom payload that sends draft configuration for backend plan override
    const payload = {
      task: messageText,
      agent_id: agentConfig.name || 'draft_agent',
      context: {
        agent_config: {
          name: agentConfig.name || 'Draft Agent',
          description: agentConfig.description || taskInput || makerPrompt,
          tools: agentConfig.tools || selectedTemplate?.tools || [],
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
          content: 'ΓÜá∩╕Å Pipeline execution failed. Please verify the active tools configuration on the left and check backend connection.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setChatLoading(false)
      setChatSteps([])
    }
  }

  // Workable Docling upload within Wizard Playground
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
      {/* Settings Modal Dialog */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="card w-96 p-6 space-y-4 border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5"><Settings2 size={16} className="text-violet-400" /> Execution Variables</h3>
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
                <label className="block text-zinc-500 mb-1">Agent Temperature</label>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={agentConfig.parameters?.temperature || 0.2} 
                  onChange={(e) => setAgentConfig({
                    ...agentConfig,
                    parameters: { ...(agentConfig.parameters || {}), temperature: Number(e.target.value) }
                  })}
                  className="w-full accent-violet-500" 
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
      <header className="flex h-12 shrink-0 items-center justify-between bg-[#0f0f11] px-4 border-b border-zinc-800">
        <div className="flex min-w-0 items-center gap-4">
          <button onClick={() => navigate('/app/dashboard')} className="text-zinc-200 hover:text-white" title="Back">
            <ArrowLeft size={22} />
          </button>
          <div className="flex min-w-0 items-center gap-4">
            <h1 className="truncate text-xl font-bold">AgentForge Creator Studio</h1>
            <span className="hidden items-center gap-2 text-sm font-semibold text-white sm:inline-flex">
              <DownloadCloud size={18} /> {publishLabel}
            </span>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full bg-black p-0.5 text-sm font-bold md:flex border border-zinc-800">
          <button
            onClick={() => setViewMode('editor')}
            className={`rounded-full px-5 py-1.5 transition ${
              viewMode === 'editor' ? 'border border-indigo-400 bg-indigo-500/20 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setViewMode('app')}
            className={`rounded-full px-5 py-1.5 transition ${
              viewMode === 'app' ? 'border border-indigo-400 bg-indigo-500/20 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            App
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleShare} className="hidden items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold md:flex border border-zinc-800 hover:bg-zinc-900 transition">
            <Share2 size={17} /> Share
          </button>
          <button onClick={handleRemix} className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-zinc-950 lg:flex hover:bg-zinc-200 transition">
            <Shuffle size={17} /> Remix
          </button>
          <button onClick={() => setShowSettings(true)} className="text-zinc-300 hover:text-white" title="Settings">
            <Settings size={22} />
          </button>
          <button onClick={() => addNotification(`User session context: ${user?.username || 'Guest'}`, 'info')} className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-zinc-500" title="Account">
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Main split screens */}
      {viewMode === 'editor' ? (
        /* STANDARD EDITOR VIEW */
        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <section className="relative min-h-[55vh] flex-1 border-b border-zinc-800/60 xl:border-b-0 xl:border-r xl:border-zinc-900">
            <WorkflowCanvas 
              nodes={nodes} 
              currentStep={currentStep} 
              setStep={setStep} 
              zoomScale={zoomScale} 
              setZoomScale={setZoomScale}
              addNotification={addNotification}
            />
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold text-zinc-300 backdrop-blur">
              <Workflow size={14} />
              AI Core Engine
            </div>
            <div className="absolute bottom-0 left-0 h-px w-full bg-violet-600/30" />
          </section>

          <PreviewPanel
            currentStep={currentStep}
            setStep={setStep}
            makerPrompt={makerPrompt}
            setMakerPrompt={setMakerPrompt}
            onGenerate={generateAgentFromPrompt}
          />
        </div>
      ) : (
        /* LIVE APP VIEW: LEFT CONFIG EDITOR & RIGHT PREMIUM PLAYGROUND CHAT */
        <div className="flex min-h-0 flex-1 flex-col xl:flex-row bg-[#0f0f11]">
          
          {/* Left panel: Live config editor */}
          <aside className="w-full xl:w-96 border-b xl:border-b-0 xl:border-r border-zinc-800 bg-[#121214] p-6 space-y-6 flex flex-col overflow-y-auto">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5"><Sliders size={16} className="text-violet-400" /> Draft Config Editor</h2>
              <p className="text-xs text-zinc-400 mt-1">Refine instructions in real-time. The chatbot on the right runs the draft config instantly.</p>
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
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">System Prompt & Goal Instructions</label>
                <textarea
                  value={agentConfig.description || taskInput || makerPrompt}
                  onChange={(e) => setAgentConfig({ ...agentConfig, description: e.target.value })}
                  placeholder="Describe details, roles, rules, and outcomes..."
                  rows={6}
                  className="input resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400">Available Workspace Tools</label>
                <div className="grid grid-cols-2 gap-2">
                  {['gmail_mcp', 'github_mcp', 'google_sheets_mcp', 'filesystem_mcp', 'slack_mcp'].map(tool => {
                    const currentTools = agentConfig.tools || []
                    const active = currentTools.includes(tool)
                    return (
                      <button
                        key={tool}
                        onClick={() => {
                          const updated = active
                            ? currentTools.filter(t => t !== tool)
                            : [...currentTools, tool]
                          setAgentConfig({ ...agentConfig, tools: updated })
                        }}
                        className={`text-left rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          active
                            ? 'border-violet-500 bg-violet-600/10 text-white'
                            : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {tool.replace('_mcp', '').toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Quick status variables */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Selected Base Template:</span>
                <span className="text-zinc-200 font-semibold">{selectedTemplate?.name || 'General Agent'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Max Steps:</span>
                <span className="text-zinc-200 font-semibold">{agentConfig.parameters?.max_steps || 5} steps</span>
              </div>
            </div>
          </aside>

          {/* Right panel: Premium Playground Chat */}
          <section className="flex-1 flex flex-col min-w-0 bg-[#0f0f11] relative">
            <header className="h-[52px] border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="text-violet-400" size={20} />
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

            {/* Messages scrolling list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-3 text-violet-400">
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
                            <Bot size={14} className="text-violet-400" />
                          </div>
                        )}
                        <div className="max-w-[75%] min-w-0">
                          <div className={`rounded-xl px-4 py-2.5 text-xs leading-relaxed border ${
                            isUser
                              ? 'bg-violet-600 border-violet-500/40 text-white rounded-tr-none'
                              : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-200 rounded-tl-none'
                          }`}>
                            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                          </div>
                          <span className="text-[9px] text-zinc-600 mt-1 block px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {isUser && (
                          <div className="w-7 h-7 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                            <User size={14} className="text-violet-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Running trace indicator */}
              {chatLoading && chatSteps.length > 0 && (
                <div className="max-w-3xl mx-auto pl-10 space-y-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 max-w-sm shadow-xl animate-pulse">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300 mb-2">
                      <Terminal size={12} className="text-violet-400" />
                      <span>Pipeline execution log</span>
                    </div>
                    <div className="space-y-1.5">
                      {chatSteps.map(step => (
                        <div key={step.step} className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400">{step.step}. {step.name}</span>
                          <span className={`badge border text-[8px] ${
                            step.status === 'done' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                            step.status === 'active' ? 'text-violet-400 bg-violet-600/10 border-violet-500/20' :
                            'text-zinc-600 border-zinc-850 bg-zinc-950'
                          }`}>
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

            {/* hidden docling parser upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleDoclingUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.json,.csv"
            />

            {/* Input Form */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/40 shrink-0">
              <div className="max-w-3xl mx-auto">
                {/* DoclingParsed indicator */}
                {doclingParsed && (
                  <div className="mb-2 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <FileText size={12} /> Docling attached: {doclingParsed.filename} (+{doclingParsed.text?.length} chars)
                    </span>
                    <button onClick={() => setDoclingParsed(null)} className="text-emerald-400 hover:text-teal-300">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Input block */}
                <div className="relative flex items-center rounded-xl border border-zinc-800 bg-[#18181b] p-1 pr-2 focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-transparent">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={chatLoading || doclingUploading}
                    className="btn-ghost p-1.5 text-zinc-500 hover:text-white"
                    title="Process document via Docling"
                  >
                    {doclingUploading ? (
                      <Loader2 className="animate-spin text-emerald-400" size={16} />
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
                    placeholder={doclingUploading ? 'Parsing document contents...' : 'Send test query to draft agent...'}
                    disabled={chatLoading}
                    className="flex-1 bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-0 px-2 py-1.5"
                  />

                  <button
                    onClick={handleSendChatMessage}
                    disabled={chatLoading || (!chatInput.trim() && !doclingParsed)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      chatInput.trim() || doclingParsed
                        ? 'bg-violet-600 hover:bg-violet-500 text-white'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
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
      )}
    </div>
  )
}
