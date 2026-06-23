import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { platformAPI } from '../services/api'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Code2,
  FileText,
  Github,
  Mail,
  Plus,
  Server,
  Slack,
  Table2,
  TestTube2,
  Wrench,
} from 'lucide-react'

const SERVER_ICONS = {
  github: Github,
  folder: FileText,
  mail: Mail,
  table: Table2,
  slack: Slack,
  notion: Clipboard,
}

const CATEGORY_TIPS = {
  github_mcp: 'Best for code, issues, pull requests, and release workflows.',
  filesystem_mcp: 'Best for local documents, generated files, and workspace automation.',
  gmail_mcp: 'Best for inbox triage, drafts, and outgoing email workflows.',
  google_sheets_mcp: 'Best for tables, reporting, and structured business data.',
  slack_mcp: 'Best for team updates, alerts, and channel summaries.',
  notion_mcp: 'Best for docs, tasks, lightweight CRM, and knowledge bases.',
}

function toId(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom_mcp'
}

export default function MCPServers() {
  const { mcpServers, setMCPServers, addNotification } = useStore()
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [tools, setTools] = useState({})
  const [executing, setExecuting] = useState(null)
  const [toolResult, setToolResult] = useState({})
  const [builder, setBuilder] = useState({
    name: 'Linear MCP',
    command: 'npx',
    args: '-y @modelcontextprotocol/server-linear',
    env: 'LINEAR_API_KEY',
    description: 'Manage issues, projects, and team workflows.',
  })

  useEffect(() => {
    platformAPI.getMCPServers()
      .then(r => setMCPServers(r.data))
      .catch(() => addNotification('Could not load MCP servers', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const totals = useMemo(() => {
    const toolsCount = mcpServers.reduce((sum, server) => sum + (server.tools_count || 0), 0)
    const connected = mcpServers.filter(server => server.connected).length
    const envVars = new Set(mcpServers.flatMap(server => server.env_required || [])).size
    return { toolsCount, connected, envVars }
  }, [mcpServers])

  const customConfig = useMemo(() => ({
    [toId(builder.name)]: {
      name: builder.name.trim() || 'Custom MCP',
      description: builder.description.trim(),
      command: builder.command.trim() || 'npx',
      args: builder.args.split(/\s+/).filter(Boolean),
      env_required: builder.env.split(/[,\n]/).map(v => v.trim()).filter(Boolean),
      icon: 'custom',
      tools: [],
    },
  }), [builder])

  async function toggleServer(id) {
    if (expanded === id) {
      setExpanded(null)
      return
    }

    setExpanded(id)
    if (!tools[id]) {
      const response = await platformAPI.getServerTools(id).catch(() => ({ data: [] }))
      setTools(current => ({ ...current, [id]: response.data }))
    }
  }

  async function executeTool(serverId, toolName) {
    const key = `${serverId}:${toolName}`
    setExecuting(key)
    try {
      const response = await platformAPI.executeTool(serverId, toolName, {})
      setToolResult(current => ({ ...current, [key]: response.data }))
      addNotification(`Tool "${toolName}" executed`, 'success')
    } catch {
      addNotification('Tool execution failed', 'error')
    } finally {
      setExecuting(null)
    }
  }

  async function copyConfig() {
    const text = JSON.stringify(customConfig, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      addNotification('MCP config copied', 'success')
    } catch {
      addNotification('Copy failed; select the config manually', 'error')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-7">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-400 mb-2">MCP Workspace</p>
          <h1 className="text-2xl font-bold text-white">Connect tools for your agents</h1>
          <p className="text-gray-400 text-sm mt-1">
            Browse built-in MCP servers, test tools, and draft new connector definitions.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 min-w-[320px]">
          {[
            ['Servers', mcpServers.length],
            ['Tools', totals.toolsCount],
            ['Env vars', totals.envVars],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2">
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.9fr] gap-5">
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-200">Built-in MCP Servers</h2>
              <p className="text-xs text-gray-500 mt-1">These connectors can be selected in the agent builder.</p>
            </div>
            <span className="badge bg-green-500/10 text-green-400 border border-green-500/25">
              {totals.connected} connected
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {mcpServers.map(server => {
                const Icon = SERVER_ICONS[server.icon] || Server
                const isExpanded = expanded === server.id

                return (
                  <div key={server.id} className="rounded-lg border border-gray-800 bg-gray-900/45 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-4 text-left p-4"
                      onClick={() => toggleServer(server.id)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white text-sm">{server.name}</p>
                          <span className={`badge border ${
                            server.connected
                              ? 'bg-green-500/10 text-green-400 border-green-500/25'
                              : 'bg-gray-800 text-gray-500 border-gray-700'
                          }`}>
                            {server.connected ? 'connected' : 'available'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{server.description}</p>
                        <p className="text-xs text-gray-600 mt-1">{CATEGORY_TIPS[server.id]}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="badge bg-gray-800 text-gray-400 border border-gray-700">
                          <Wrench size={10} className="inline mr-1" />{server.tools_count} tools
                        </span>
                        {isExpanded ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-800">
                        {server.env_required?.length > 0 && (
                          <div className="my-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            <p className="text-xs text-amber-300 font-medium mb-2">Required environment variables</p>
                            <div className="flex flex-wrap gap-1.5">
                              {server.env_required.map(env => (
                                <code key={env} className="text-xs bg-gray-950 text-amber-200 px-2 py-1 rounded border border-gray-800">{env}</code>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Tools</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          {(tools[server.id] || []).map(tool => {
                            const key = `${server.id}:${tool.name}`
                            const result = toolResult[key]

                            return (
                              <div key={tool.name} className="bg-gray-950/50 border border-gray-800 rounded-lg p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-200">{tool.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{tool.description}</p>
                                  </div>
                                  <button
                                    onClick={() => executeTool(server.id, tool.name)}
                                    disabled={executing === key}
                                    className="btn-ghost text-xs py-1 px-2 shrink-0"
                                  >
                                    {executing === key ? (
                                      <span className="animate-pulse text-violet-400">Testing</span>
                                    ) : (
                                      <><TestTube2 size={12} /> Test</>
                                    )}
                                  </button>
                                </div>
                                {result && (
                                  <pre className="mt-3 text-xs text-gray-400 bg-gray-950 p-2 rounded overflow-x-auto max-h-32 border border-gray-800">
                                    {JSON.stringify(result, null, 2)}
                                  </pre>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <aside className="card h-fit xl:sticky xl:top-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-violet-600/10 border border-violet-500/25 flex items-center justify-center">
              <Code2 size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Create Custom MCP</h2>
              <p className="text-xs text-gray-500">Draft a registry entry for a new connector.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Connector name</label>
              <input
                className="input"
                value={builder.name}
                onChange={e => setBuilder({ ...builder, name: e.target.value })}
              />
              <p className="text-xs text-gray-600 mt-1">Registry ID: {toId(builder.name)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Description</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={builder.description}
                onChange={e => setBuilder({ ...builder, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Command</label>
                <input
                  className="input"
                  value={builder.command}
                  onChange={e => setBuilder({ ...builder, command: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Env vars</label>
                <input
                  className="input"
                  value={builder.env}
                  onChange={e => setBuilder({ ...builder, env: e.target.value })}
                  placeholder="API_KEY, ORG_ID"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Arguments</label>
              <input
                className="input font-mono text-sm"
                value={builder.args}
                onChange={e => setBuilder({ ...builder, args: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-gray-800 bg-gray-950/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-medium text-gray-300">Registry draft</span>
              <button onClick={copyConfig} className="btn-ghost text-xs py-1 px-2">
                <Clipboard size={12} /> Copy
              </button>
            </div>
            <pre className="max-h-80 overflow-auto p-3 text-xs text-gray-400">
              {JSON.stringify(customConfig, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg border border-violet-500/20 bg-violet-600/5 p-3 mt-4">
            <div className="flex items-start gap-2">
              <Check size={14} className="text-violet-400 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Add this draft to the backend MCP registry, then agents can select it from the builder.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
