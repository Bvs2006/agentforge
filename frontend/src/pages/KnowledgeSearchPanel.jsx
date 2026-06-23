import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { knowledgeAPI } from '../services/api'
import {
  Search, Loader2, FileText, Globe, Code, Table,
  Bot, ArrowLeft, BookOpen, ExternalLink, Hash,
} from 'lucide-react'

export default function KnowledgeSearchPanel() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    knowledgeAPI.listAgents().then(r => setAgents(r.data || [])).catch(() => {})
  }, [])

  const handleSearch = async () => {
    if (!query.trim() || !selectedAgentId) return
    setSearching(true)
    try {
      const res = await knowledgeAPI.search(selectedAgentId, query, 10)
      setResults(res.data)
    } catch {}
    setSearching(false)
  }

  return (
    <div className="min-h-screen bg-[#0e1014] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/app/knowledge')} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-4 transition">
          <ArrowLeft size={16} />
          Knowledge Workspace
        </button>

        <h1 className="text-xl font-bold mb-1">Knowledge Search</h1>
        <p className="text-sm text-zinc-400 mb-6">Semantic search across your knowledge agents</p>

        <div className="flex gap-3 mb-6">
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
            className="input w-64 text-sm"
          >
            <option value="">Select Knowledge Agent...</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <div className="flex-1 relative">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Semantic search query..."
              className="input w-full pl-10 text-sm"
              disabled={!selectedAgentId}
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>
          <button onClick={handleSearch} disabled={!query.trim() || !selectedAgentId || searching} className="btn-primary px-6 text-sm">
            {searching ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
          </button>
        </div>

        {results && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">{results.count || results.results?.length || 0} result(s)</p>
            {(results.results || []).map((r, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Hash size={14} className="text-ibm-blue" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-200 leading-relaxed mb-2">{r.content?.slice(0, 500)}</p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        {r.metadata?.source_type === 'website' ? <Globe size={10} /> :
                         r.metadata?.source_type === 'repository' ? <Code size={10} /> :
                         r.metadata?.source_type === 'spreadsheet' ? <Table size={10} /> :
                         <FileText size={10} />}
                        {r.metadata?.source_type || 'unknown'}
                      </span>
                      {r.metadata?.filename && <span>{r.metadata.filename}</span>}
                      <span className="ml-auto">Score: {(r.score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
