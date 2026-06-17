import { useStore } from '../../hooks/useStore'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'

const CATEGORY_COLORS = {
  communication: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  development:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
  productivity:  'text-teal-400 bg-teal-500/10 border-teal-500/20',
  data:          'text-green-400 bg-green-500/10 border-green-500/20',
  research:      'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  general:       'text-gray-400 bg-gray-500/10 border-gray-500/20',
}

export default function StepChooseTemplate() {
  const { templates, selectedTemplate, setSelectedTemplate, setStep } = useStore()

  const handleSelect = t => {
    setSelectedTemplate(t)
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Choose an agent template</h2>
        <p className="text-sm text-gray-400 mt-1">Select the template that best matches your task</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {templates.map(t => {
          const sel = selectedTemplate?.id === t.id
          const cc = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.general
          return (
            <button key={t.id}
              onClick={() => handleSelect(t)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                sel
                  ? 'border-ibm-blue bg-ibm-blue/10 shadow-lg shadow-blue-900/20'
                  : 'border-gray-700/60 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/40'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{t.icon}</span>
                {sel && (
                  <div className="w-5 h-5 rounded-full bg-ibm-blue flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{t.name}</h3>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">{t.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className={`badge border ${cc}`}>{t.category}</span>
                {t.tools.map(tool => (
                  <span key={tool} className="badge bg-gray-800 text-gray-400 border border-gray-700">{tool.replace('_mcp','')}</span>
                ))}
              </div>
            </button>
          )
        })}

        {/* Loading skeletons */}
        {!templates.length && Array(6).fill(0).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 animate-pulse">
            <div className="w-8 h-8 bg-gray-800 rounded-lg mb-3" />
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-full mb-1" />
            <div className="h-3 bg-gray-800 rounded w-5/6" />
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button className="btn-secondary" onClick={() => setStep(0)}>
          <ArrowLeft size={15} /> Back
        </button>
        <button
          className="btn-primary"
          onClick={() => setStep(2)}
          disabled={!selectedTemplate}
        >
          Continue <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
