import { ArrowRight } from 'lucide-react'

export function PageShell({ eyebrow, title, description, action, children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-7xl p-6 animate-fade-in ${className}`}>
      <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ibm-teal">{eyebrow}</p>
          ) : null}
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description ? <p className="mt-1 text-sm text-gray-400">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </div>
  )
}

export function SectionCard({ title, description, meta, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || description || meta) ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-sm font-semibold text-gray-200">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
          </div>
          {meta ? <div className="shrink-0">{meta}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function MetricCard({ label, value, icon: Icon, tone = 'blue', detail }) {
  const tones = {
    blue: 'bg-ibm-blue/10 text-ibm-blue border-ibm-blue/20',
    purple: 'bg-ibm-purple/10 text-ibm-purple border-ibm-purple/20',
    teal: 'bg-ibm-teal/10 text-ibm-teal border-ibm-teal/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
  }

  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tones[tone] || tones.blue}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-white">{value}</p>
        <p className="mt-1 text-xs text-gray-400">{label}</p>
        {detail ? <p className="mt-1 truncate text-[11px] text-gray-600">{detail}</p> : null}
      </div>
    </div>
  )
}

export function ActionRow({ icon: Icon, title, description, tone = 'text-ibm-blue', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all hover:bg-gray-800/60"
    >
      <Icon size={16} className={tone} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-200">{title}</span>
        <span className="block truncate text-xs text-gray-500">{description}</span>
      </span>
      <ArrowRight size={14} className="text-gray-600 transition-colors group-hover:text-gray-400" />
    </button>
  )
}

export function StatusPill({ ok, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-950/50 px-2.5 py-1 text-xs text-gray-400">
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
      {label}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/40 px-4 py-8 text-center">
      <Icon size={28} className="mx-auto mb-2 text-gray-600" />
      <p className="text-sm font-medium text-gray-300">{title}</p>
      {description ? <p className="mt-1 text-xs text-gray-600">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
