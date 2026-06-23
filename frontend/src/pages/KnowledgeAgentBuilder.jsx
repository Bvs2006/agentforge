import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { knowledgeAPI } from '../services/api'
import {
  Brain, ArrowLeft, Upload, FileText, Globe, Code, Table,
  Loader2, CheckCircle2, X, Plus, Bot, AlertCircle,
  FolderOpen, Link, File as FileIcon,
} from 'lucide-react'

const sourceTypes = [
  { id: 'document', icon: FileText, label: 'Documents', desc: 'PDF, DOCX, TXT, MD files', color: 'border-ibm-blue text-ibm-blue bg-ibm-blue/10' },
  { id: 'repository', icon: Code, label: 'Repository', desc: 'GitHub, GitLab, or local folder', color: 'border-ibm-purple text-ibm-purple bg-ibm-purple/10' },
  { id: 'website', icon: Globe, label: 'Website', desc: 'URL, documentation site', color: 'border-ibm-teal text-ibm-teal bg-ibm-teal/10' },
  { id: 'spreadsheet', icon: Table, label: 'Spreadsheet', desc: 'CSV, Excel files', color: 'border-ibm-cyan text-ibm-cyan bg-ibm-cyan/10' },
]

export default function KnowledgeAgentBuilder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSources, setSelectedSources] = useState([])
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [createdAgent, setCreatedAgent] = useState(null)
  const fileInputRef = useRef(null)

  const addSource = (type) => {
    if (type === 'document' || type === 'spreadsheet') {
      fileInputRef.current?.click()
      return
    }
    setSelectedSources(prev => [...prev, {
      id: Date.now().toString(),
      type,
      name: '',
      url: '',
      path: '',
      status: 'pending',
    }])
  }

  const updateSource = (id, updates) => {
    setSelectedSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const removeSource = (id) => {
    setSelectedSources(prev => prev.filter(s => s.id !== id))
  }

  const handleFileUpload = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    const newSources = files.map(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const type = (ext === 'csv' || ext === 'xlsx' || ext === 'xls') ? 'spreadsheet' : 'document'
      return {
        id: Date.now().toString() + Math.random(),
        type,
        name: file.name,
        file,
        url: '',
        path: '',
        status: 'pending',
      }
    })
    if (newSources.length > 0) {
      setSelectedSources(prev => [...prev, ...newSources])
    }
    e.target.value = ''
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        memory_enabled: true,
        sources: selectedSources.map(s => ({
          type: s.type,
          name: s.name,
          url: s.url || undefined,
          path: s.path || undefined,
        })),
      }
      const res = await knowledgeAPI.createAgent(payload)
      const agent = res.data
      setProgress({ current: 0, total: selectedSources.length, agentId: agent.id })

      for (let i = 0; i < selectedSources.length; i++) {
        const src = selectedSources[i]
        setProgress(p => ({ ...p, current: i + 1, message: `Ingesting ${src.name}...` }))
        if (src.file) {
          const formData = new FormData()
          formData.append('file', src.file)
          await knowledgeAPI.uploadSourceFile(agent.id, formData)
        } else if (src.url) {
          const sourceData = { type: src.type, name: src.name, url: src.url }
          const srcRes = await knowledgeAPI.addSource(agent.id, sourceData)
          await knowledgeAPI.ingestSource(agent.id, srcRes.data.id)
        } else if (src.path) {
          const sourceData = { type: src.type, name: src.name, path: src.path }
          const srcRes = await knowledgeAPI.addSource(agent.id, sourceData)
          await knowledgeAPI.ingestSource(agent.id, srcRes.data.id)
        }
      }

      setCreatedAgent(agent)
    } catch (err) {
      console.error('Failed to create agent:', err)
    } finally {
      setCreating(false)
    }
  }

  if (createdAgent) {
    return (
      <div className="min-h-screen bg-[#0e1014] text-white p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Knowledge Agent Created</h2>
          <p className="text-sm text-zinc-400 mb-2">{createdAgent.name}</p>
          <p className="text-xs text-zinc-500 mb-6">Your agent is ready with {selectedSources.length} source(s) indexed</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(`/app/knowledge/${createdAgent.id}`)} className="btn-primary px-6 py-2.5 text-sm">
              Open Chat
            </button>
            <button onClick={() => navigate('/app/knowledge')} className="btn-secondary px-6 py-2.5 text-sm">
              Back to Workspace
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e1014] text-white">
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => navigate('/app/knowledge')} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition">
          <ArrowLeft size={16} />
          Back to Knowledge Workspace
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center">
            <Brain size={20} className="text-ibm-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Create Knowledge Agent</h1>
            <p className="text-sm text-zinc-400">Upload sources and get an AI chatbot with a vector knowledge base</p>
          </div>
        </div>

        <div className="space-y-6 pb-24">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <label className="block text-sm font-semibold mb-1">Agent Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Resume Assistant, Codebase Guide, Business Analyst"
              className="input w-full"
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <label className="block text-sm font-semibold mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this knowledge agent should help with..."
              rows={3}
              className="input w-full resize-none"
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Knowledge Sources</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Upload size={12} />
                Upload Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.xls,.py,.js,.ts,.jsx,.tsx,.java,.go,.rs"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {sourceTypes.map(st => (
                <button
                  key={st.id}
                  onClick={() => addSource(st.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-700 p-4 text-center hover:border-zinc-500 transition ${st.color}`}
                >
                  <st.icon size={20} />
                  <span className="text-xs font-semibold">{st.label}</span>
                  <span className="text-[9px] opacity-70">{st.desc}</span>
                </button>
              ))}
            </div>

            {selectedSources.length > 0 && (
              <div className="space-y-2">
                {selectedSources.map(source => (
                  <div key={source.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                    {source.type === 'document' ? <FileText size={14} className="text-ibm-blue" /> :
                     source.type === 'repository' ? <Code size={14} className="text-ibm-purple" /> :
                     source.type === 'website' ? <Globe size={14} className="text-ibm-teal" /> :
                     <Table size={14} className="text-ibm-cyan" />}
                    {source.file ? (
                      <span className="flex-1 text-xs truncate">{source.file.name}</span>
                    ) : source.type === 'website' ? (
                      <input
                        value={source.url}
                        onChange={e => updateSource(source.id, { url: e.target.value, name: e.target.value })}
                        placeholder="https://docs.example.com"
                        className="flex-1 bg-transparent text-xs border-b border-zinc-700 focus:border-ibm-blue outline-none px-1 py-0.5"
                      />
                    ) : source.type === 'repository' ? (
                      <input
                        value={source.url || source.path}
                        onChange={e => updateSource(source.id, { url: e.target.value, name: e.target.value })}
                        placeholder="GitHub URL or local path"
                        className="flex-1 bg-transparent text-xs border-b border-zinc-700 focus:border-ibm-blue outline-none px-1 py-0.5"
                      />
                    ) : (
                      <input
                        value={source.path}
                        onChange={e => updateSource(source.id, { path: e.target.value, name: e.target.value })}
                        placeholder="File path"
                        className="flex-1 bg-transparent text-xs border-b border-zinc-700 focus:border-ibm-blue outline-none px-1 py-0.5"
                      />
                    )}
                    <span className="text-[10px] text-zinc-500 uppercase">{source.type}</span>
                    <button onClick={() => removeSource(source.id)} className="text-zinc-600 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {progress && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Loader2 className="animate-spin text-ibm-blue" size={16} />
                <span>Indexing sources... {progress.current}/{progress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-ibm-blue transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
              {progress.message && <p className="text-xs text-zinc-500 mt-1">{progress.message}</p>}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#0e1014]/95 backdrop-blur p-4 z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-1 min-w-0">
              {selectedSources.length > 0 && (
                <p className="text-xs text-zinc-500">
                  {selectedSources.length} source{selectedSources.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || selectedSources.length === 0 || creating}
              className="btn-primary px-8 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              {creating ? (
                <><Loader2 className="animate-spin" size={16} /> Creating...</>
              ) : (
                <><Bot size={16} /> Create Knowledge Agent</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
