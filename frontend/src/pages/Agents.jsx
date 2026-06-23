import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { agentAPI, platformAPI } from '../services/api'
import {
  Bot,
  Calendar,
  Check,
  FileText,
  Github,
  Mail,
  MessageSquare,
  Plus,
  Play,
  Search,
  Sparkles,
  Table2,
  Trash2,
  Wand2,
  Wrench,
} from 'lucide-react'

const CATEGORY_STYLES = {
  communication: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  development: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  productivity: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  data: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  research: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  general: 'text-gray-300 bg-gray-500/10 border-gray-600',
  custom: 'text-ibm-blue bg-ibm-blue/10 border-ibm-blue/25',
}

const TEMPLATE_ICONS = {
  email_agent: Mail,
  github_agent: Github,
  document_agent: FileText,
  sheets_agent: Table2,
  research_agent: Search,
  general_agent: Bot,
  custom_agent: Wand2,
}

const TOOL_LABELS = {
  github_mcp: 'GitHub',
  gmail_mcp: 'Gmail',
  google_sheets_mcp: 'Sheets',
  filesystem_mcp: 'Files',
  slack_mcp: 'Slack',
  notion_mcp: 'Notion',
}

function slugName(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export default function Agents() {
  const {
    agents,
    setAgents,
    templates,
    setTemplates,
    mcpServers,
    setMCPServers,
    addNotification,
  } = useStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [query, setQuery] = useState('')
  const [builder, setBuilder] = useState({
    name: '',
    description: '',
    goal: '',
    tools: [],
    max_steps: 5,
    verbosity: 'normal',
  })
  const navigate = useNavigate()

  useEffect(() => {
    Promise.allSettled([
      agentAPI.listAgents().then(r => setAgents(r.data)),
      agentAPI.getTemplates().then(r => {
        setTemplates(r.data)
        if (r.data[0]) selectTemplate(r.data[0])
      }),
      platformAPI.getMCPServers().then(r => setMCPServers(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const builtInTemplates = useMemo(() => templates.filter(t => t.id !== 'custom_agent'), [templates])
  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  )

  const filteredAgents = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return agents
    return agents.filter(agent =>
      [agent.name, agent.description, agent.template_id, ...(agent.tools || [])]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [agents, query])

  function selectTemplate(template) {
    setSelectedTemplateId(template.id)
    setBuilder(current => ({
      ...current,
      name: current.name || template.name,
      description: template.description,
      tools: template.tools || [],
    }))
  }

  function selectCustom() {
    setSelectedTemplateId('custom_agent')
    setBuilder(current => ({
      ...current,
      name: current.name || 'Custom Agent',
      description: current.description || 'A custom agent assembled from selected MCP tools.',
      tools: current.tools || [],
    }))
  }

  function toggleTool(serverId) {
    setBuilder(current => ({
      ...current,
      tools: current.tools.includes(serverId)
        ? current.tools.filter(t => t !== serverId)
        : [...current.tools, serverId],
    }))
  }

  async function saveAgent() {
    if (!builder.name.trim()) {
      addNotification('Agent name is required', 'error')
      return
    }

    setSaving(true)
    const payload = {
      template_id: selectedTemplate?.id || 'custom_agent',
      name: builder.name.trim(),
      description: builder.goal.trim() || builder.description,
      tools: builder.tools,
      parameters: {
        max_steps: Number(builder.max_steps),
        verbosity: builder.verbosity,
        goal: builder.goal,
        builder_source: selectedTemplate?.id ? 'built_in_template' : 'custom_builder',
      },
    }

    try {
      const response = await agentAPI.createAgent(payload)
      setAgents([response.data, ...agents.filter(agent => agent.name !== response.data.name)])
      addNotification(`Agent "${response.data.name}" created`, 'success')
    } catch {
      addNotification('Could not create agent', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteAgent(name) {
    if (!confirm(`Delete agent "${name}"?`)) return
    try {
      await agentAPI.deleteAgent(name)
      setAgents(agents.filter(agent => agent.name !== name))
      addNotification(`Agent "${name}" deleted`, 'info')
    } catch {
      addNotification('Could not delete agent', 'error')
    }
  }

  const SelectedIcon = TEMPLATE_ICONS[selectedTemplate?.id] || Wand2

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-7">
        <p className="text-xs uppercase tracking-[0.18em] text-ibm-teal mb-2">Agent Builder</p>
        <h1 className="text-2xl font-bold text-white">Build agents from templates or scratch</h1>
        <p className="text-gray-400 text-sm mt-1">
          Start with built-in agents, tune their MCP tools, or create a custom automation agent.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-5">
        <section className="space-y-5">
          <div className="card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Built-in Agents</h2>
                <p className="text-xs text-gray-500 mt-1">Starter agents you can customize before saving.</p>
              </div>
              <span className="badge bg-gray-800 text-gray-400 border border-gray-700">
                {builtInTemplates.length} templates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {loading && !builtInTemplates.length ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 animate-pulse">
                    <div className="h-9 w-9 rounded-lg bg-gray-800 mb-4" />
                    <div className="h-4 w-2/3 rounded bg-gray-800 mb-2" />
                    <div className="h-3 w-full rounded bg-gray-800" />
                  </div>
                ))
              ) : (
                builtInTemplates.map(template => {
                  const active = selectedTemplateId === template.id
                  const Icon = TEMPLATE_ICONS[template.id] || Bot
                  const style = CATEGORY_STYLES[template.category] || CATEGORY_STYLES.general

                  return (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={`text-left rounded-lg border p-4 transition-all ${
                        active
                          ? 'border-ibm-blue bg-ibm-blue/10 shadow-lg shadow-blue-950/30'
                          : 'border-gray-800 bg-gray-900/45 hover:bg-gray-800/60 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center shrink-0">
                          <Icon size={16} className={active ? 'text-ibm-blue' : 'text-gray-300'} />
                        </div>
                        <h3 className="font-semibold text-white text-sm leading-tight">{template.name}</h3>
                        {active && <Check size={14} className="text-ibm-blue ml-auto shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{template.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        <span className={`badge border ${style}`}>{template.category}</span>
                        {(template.tools || []).map(tool => (
                          <span key={tool} className="badge bg-gray-800 text-gray-400 border border-gray-700">
                            {TOOL_LABELS[tool] || tool.replace('_mcp', '')}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })
              )}

              <button
                onClick={selectCustom}
                className={`text-left rounded-lg border border-dashed p-4 transition-all ${
                  selectedTemplateId === 'custom_agent'
                    ? 'border-ibm-blue bg-ibm-blue/10'
                    : 'border-gray-700 bg-gray-900/30 hover:border-gray-500 hover:bg-gray-800/50'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-ibm-blue/10 border border-ibm-blue/25 flex items-center justify-center mb-3">
                  <Plus size={17} className="text-ibm-blue" />
                </div>
                <h3 className="font-semibold text-white text-sm">Create New Agent</h3>
                <p className="text-xs text-gray-400 leading-relaxed mt-1">
                  Choose your own MCP tools, goal, and execution style.
                </p>
                <span className={`badge border ${CATEGORY_STYLES.custom} inline-flex mt-3`}>custom</span>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Saved Agents</h2>
                <p className="text-xs text-gray-500 mt-1">Agents ready to run from your workspace.</p>
              </div>
              <div className="relative sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  className="input pl-9 text-sm"
                  placeholder="Search agents"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredAgents.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-gray-950/40 py-10 text-center">
                <Bot size={26} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-300">No saved agents yet</p>
                <p className="text-xs text-gray-600 mt-1">Pick a built-in agent or create a custom one to begin.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {filteredAgents.map(agent => (
                  <div
                    key={agent.id || agent.name}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg cursor-pointer hover:bg-gray-800/40 transition-all duration-200 -mx-2"
                    onClick={() => navigate(`/app/chat/${agent.name}`)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-ibm-blue/10 flex items-center justify-center shrink-0">
                      <Bot size={15} className="text-ibm-blue" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-white truncate">{agent.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500">{agent.template_id || 'custom'}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-[10px] text-gray-500">{(agent.tools || []).length} tools</span>
                        {agent.created_at && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="text-[10px] text-gray-600">{new Date(agent.created_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/chat/${agent.name}`) }}
                        className="btn-primary text-[11px] px-2.5 py-1.5"
                      >
                        <MessageSquare size={11} /> Chat
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/app/run') }}
                        className="btn-secondary text-[11px] px-2.5 py-1.5"
                      >
                        <Play size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAgent(agent.name) }}
                        className="btn-ghost p-1.5 text-gray-600 hover:text-red-400"
                        title="Delete agent"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="card h-fit xl:sticky xl:top-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-ibm-purple/10 border border-ibm-purple/25 flex items-center justify-center">
              <SelectedIcon size={18} className="text-ibm-purple" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Configure Agent</h2>
              <p className="text-xs text-gray-500">Save it once, run it anytime.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Agent name</label>
              <input
                className="input"
                value={builder.name}
                onChange={e => setBuilder({ ...builder, name: e.target.value })}
                placeholder="e.g. Release Notes Agent"
              />
              <p className="text-xs text-gray-600 mt-1">ID preview: {slugName(builder.name) || 'agent_name'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Goal</label>
              <textarea
                className="input resize-none"
                rows={4}
                value={builder.goal}
                onChange={e => setBuilder({ ...builder, goal: e.target.value })}
                placeholder="What should this agent accomplish for the user?"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400 font-medium block">MCP tools</label>
                <button onClick={() => navigate('/app/mcp')} className="text-xs text-ibm-blue hover:underline">
                  Manage MCP
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mcpServers.map(server => {
                  const active = builder.tools.includes(server.id)
                  return (
                    <button
                      key={server.id}
                      onClick={() => toggleTool(server.id)}
                      className={`text-left rounded-lg border px-3 py-2 transition-all ${
                        active
                          ? 'border-ibm-blue bg-ibm-blue/10 text-white'
                          : 'border-gray-800 bg-gray-950/40 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <span className="block text-xs font-medium">{TOOL_LABELS[server.id] || server.name}</span>
                      <span className="block text-[11px] text-gray-600 mt-0.5">{server.tools_count} tools</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Max steps</label>
                <select
                  className="input"
                  value={builder.max_steps}
                  onChange={e => setBuilder({ ...builder, max_steps: e.target.value })}
                >
                  {[3, 5, 10, 20].map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Verbosity</label>
                <select
                  className="input"
                  value={builder.verbosity}
                  onChange={e => setBuilder({ ...builder, verbosity: e.target.value })}
                >
                  <option value="minimal">Minimal</option>
                  <option value="normal">Normal</option>
                  <option value="verbose">Verbose</option>
                </select>
              </div>
            </div>
          </div>

          <button onClick={saveAgent} disabled={saving || !builder.name.trim()} className="btn-primary w-full justify-center mt-5">
            {saving ? <Sparkles size={16} className="animate-pulse" /> : <Plus size={16} />}
            {saving ? 'Creating Agent...' : 'Create Agent'}
          </button>
        </aside>
      </div>
    </div>
  )
}
