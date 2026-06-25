import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { knowledgeAPI } from '../services/api'
import {
  ArrowLeft, FileText, Globe, Code, Table, Plus, X,
  CheckCircle2, AlertCircle, Loader2, Trash2, Upload,
  RefreshCw, FolderOpen,
} from 'lucide-react'

export default function KnowledgeSourceManager() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [sources, setSources] = useState([])
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      knowledgeAPI.getAgent(agentId),
      knowledgeAPI.listSources(agentId),
    ])
      .then(([a, s]) => {
        setAgent(a.data)
        setSources(s.data || [])
      })
      .catch(() => navigate('/app/knowledge'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [agentId])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await knowledgeAPI.uploadSourceFile(agentId, formData)
      loadData()
    } catch {}
    setUploading(false)
  }

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return
    const isRepo = urlInput.includes('github.com') || urlInput.includes('gitlab.com')
    const sourceData = {
      type: isRepo ? 'repository' : 'website',
      name: urlInput.trim(),
      url: urlInput.trim(),
    }
    try {
      const res = await knowledgeAPI.addSource(agentId, sourceData)
      await knowledgeAPI.ingestSource(agentId, res.data.id)
      setUrlInput('')
      loadData()
    } catch {}
  }

  const handleDeleteSource = async (sourceId) => {
    try {
      await knowledgeAPI.deleteSource(agentId, sourceId)
      loadData()
    } catch {}
  }

  const handleReingest = async (sourceId) => {
    try {
      await knowledgeAPI.ingestSource(agentId, sourceId)
      loadData()
    } catch {}
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'repository': return Code
      case 'website': return Globe
      case 'spreadsheet': return Table
      default: return FileText
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center"><Loader2 className="animate-spin text-violet-400" size={24} /></div>

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(`/app/knowledge/${agentId}`)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-4 transition">
          <ArrowLeft size={16} />
          Back to {agent?.name || 'Agent'}
        </button>

        <h1 className="text-xl font-bold mb-1">Source Manager</h1>
        <p className="text-sm text-zinc-400 mb-6">Manage knowledge sources for {agent?.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Upload size={14} className="text-violet-400" /> Upload File
            </h3>
            <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 p-6 cursor-pointer hover:border-violet-500/50 transition">
              <Upload size={20} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">Click to upload PDF, DOCX, TXT, MD, CSV, XLSX</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.xls" />
            </label>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Globe size={14} className="text-emerald-400" /> Add URL
            </h3>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Website URL or GitHub repo..."
                className="input flex-1 text-sm"
              />
              <button onClick={handleAddUrl} className="btn-primary text-xs px-4">Add</button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
          <h3 className="text-sm font-semibold mb-4">Sources ({sources.length})</h3>
          {sources.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No sources added yet</p>
          ) : (
            <div className="space-y-2">
              {sources.map(source => {
                const Icon = getTypeIcon(source.type)
                return (
                  <div key={source.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                    <Icon size={16} className={
                      source.type === 'website' ? 'text-emerald-400' :
                      source.type === 'repository' ? 'text-purple-400' :
                      source.type === 'spreadsheet' ? 'text-cyan-400' :
                      'text-violet-400'
                    } />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{source.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {source.type} &middot; {source.chunks_count || 0} chunks
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {source.status === 'completed' ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : source.status === 'failed' ? (
                        <span className="text-[10px] text-red-400" title={source.error}>{source.error?.slice(0, 30)}</span>
                      ) : (
                        <Loader2 size={14} className="animate-spin text-yellow-500" />
                      )}
                      <button onClick={() => handleReingest(source.id)} className="text-zinc-600 hover:text-emerald-400 transition" title="Re-ingest">
                        <RefreshCw size={12} />
                      </button>
                      <button onClick={() => handleDeleteSource(source.id)} className="text-zinc-600 hover:text-red-400 transition" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
