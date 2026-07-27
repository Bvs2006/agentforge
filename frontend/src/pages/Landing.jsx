import { Link, useNavigate } from 'react-router-dom'
import { Bot, Brain, Sparkles, ArrowRight, MessageSquare, FileText, Globe, Code, Zap, Shield, Cpu } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { useEffect } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const username = useStore(s => s.username)

  useEffect(() => {
    if (username) navigate('/app/dashboard', { replace: true })
  }, [username])

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white relative">
      <style>{`
        @keyframes glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .glow-orb { animation: glow 4s ease-in-out infinite; }
        .group:hover .shimmer-slide {
          animation: shimmer 0.6s ease-in-out;
        }
      `}</style>

      {/* Background layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-[#0f0f11]/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group/logo">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover/logo:shadow-violet-500/40 transition-shadow duration-300">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">AgentForge</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-primary text-sm px-5 py-2">Enter</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none glow-orb" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-8 hover:bg-violet-500/15 transition-colors">
          <Zap size={12} />
          AI Agent Platform
        </div>

        <h1 className="text-5xl font-bold leading-tight mb-6 max-w-3xl mx-auto relative">
          Create AI Agents That
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-violet-500 to-emerald-400 bg-clip-text text-transparent">
            Work With Your Data
          </span>
        </h1>

        <p className="text-base text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Build intelligent assistants that answer questions from your documents, code repositories,
          websites, and spreadsheets. No coding required.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link to="/login" className="btn-primary px-8 py-3 text-base flex items-center gap-2 group/btn">
            Start Building <ArrowRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
          <Link to="/login" className="btn-secondary px-8 py-3 text-base hover:bg-white/[0.08] transition-colors">
            Enter
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Features</p>
          <h2 className="text-3xl font-bold">What You Can Build</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Brain, title: 'Knowledge Agents', desc: 'Upload PDFs, DOCX, or link websites. Your agent learns from them and answers questions with citations.', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { icon: Bot, title: 'Task Agents', desc: 'Create agents that automate workflows using connected tools like GitHub, Gmail, and Sheets.', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { icon: MessageSquare, title: 'Chat Interface', desc: 'Each agent gets its own chat. Ask questions, get answers with source references.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { icon: FileText, title: 'Document Ingestion', desc: 'Extract text from PDFs, Word docs, and markdown files. Automatically chunked and indexed.', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
            { icon: Globe, title: 'Website Crawling', desc: 'Point to a documentation site or any URL. Your agent will crawl and index the content.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { icon: Code, title: 'Repository Indexing', desc: 'Connect GitHub repos or local folders. Your agent understands your codebase.', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          ].map(f => (
            <div key={f.title} className="group relative rounded-xl border bg-[#0f0f11]/60 backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/5 overflow-hidden">
              <div className="shimmer-slide absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />
              <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4 relative transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-violet-500/10`}>
                <f.icon size={20} className={f.color} />
              </div>
              <h3 className="font-semibold text-white text-sm mb-2 relative">{f.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed relative">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.04] via-emerald-500/[0.04] to-violet-500/[0.04]" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to build your first agent?</h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Pick a username and start building agents in minutes.</p>
          <Link to="/login" className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2 group/btn">
            Get Started <ArrowRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
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
