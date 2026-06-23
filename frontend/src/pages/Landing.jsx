import { Link, useNavigate } from 'react-router-dom'
import { Bot, Brain, Sparkles, ArrowRight, MessageSquare, FileText, Globe, Code, Zap, Shield, Cpu } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { useEffect } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const token = useStore(s => s.token)

  useEffect(() => {
    if (token) navigate('/app/dashboard', { replace: true })
  }, [token])

  return (
    <div className="min-h-screen bg-[#0a0c12] text-white">
      <header className="border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ibm-blue to-ibm-purple flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">AgentForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-5 py-2">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ibm-blue/10 border border-ibm-blue/20 text-ibm-blue text-xs font-medium mb-8">
          <Zap size={12} />
          AI Agent Platform
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6 max-w-3xl mx-auto">
          Create AI Agents That
          <span className="bg-gradient-to-r from-ibm-blue to-ibm-purple bg-clip-text text-transparent"> Work With Your Data</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Build intelligent assistants that answer questions from your documents, code repositories, 
          websites, and spreadsheets. No coding required.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="btn-primary px-8 py-3 text-base flex items-center gap-2">
            Start Building <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-secondary px-8 py-3 text-base">
            Sign In
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Features</p>
          <h2 className="text-3xl font-bold">What You Can Build</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Brain, title: 'Knowledge Agents', desc: 'Upload PDFs, DOCX, or link websites. Your agent learns from them and answers questions with citations.', color: 'text-ibm-blue', bg: 'bg-ibm-blue/10 border-ibm-blue/20' },
            { icon: Bot, title: 'Task Agents', desc: 'Create agents that automate workflows using connected tools like GitHub, Gmail, and Sheets.', color: 'text-ibm-purple', bg: 'bg-ibm-purple/10 border-ibm-purple/20' },
            { icon: MessageSquare, title: 'Chat Interface', desc: 'Each agent gets its own chat. Ask questions, get answers with source references.', color: 'text-ibm-teal', bg: 'bg-ibm-teal/10 border-ibm-teal/20' },
            { icon: FileText, title: 'Document Ingestion', desc: 'Extract text from PDFs, Word docs, and markdown files. Automatically chunked and indexed.', color: 'text-ibm-cyan', bg: 'bg-ibm-cyan/10 border-ibm-cyan/20' },
            { icon: Globe, title: 'Website Crawling', desc: 'Point to a documentation site or any URL. Your agent will crawl and index the content.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { icon: Code, title: 'Repository Indexing', desc: 'Connect GitHub repos or local folders. Your agent understands your codebase.', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          ].map(f => (
            <div key={f.title} className={`rounded-xl border ${f.bg} p-6`}>
              <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon size={20} className={f.color} />
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to build your first agent?</h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Create an account and start building in minutes. No credit card required.</p>
          <Link to="/register" className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2">
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-800/60 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-zinc-600">AgentForge AI Assistant Platform</p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>Built with FastAPI + React</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
