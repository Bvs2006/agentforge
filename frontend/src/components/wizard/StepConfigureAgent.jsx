import { useStore } from '../../hooks/useStore'
import { ArrowRight, ArrowLeft, Settings2 } from 'lucide-react'

export default function StepConfigureAgent() {
  const { agentConfig, setAgentConfig, selectedTemplate, setStep } = useStore()

  const update = (k, v) => setAgentConfig({ ...agentConfig, [k]: v })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-violet-600/15 flex items-center justify-center">
            <Settings2 size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Configure your agent</h2>
            <p className="text-xs text-gray-400">Customize how the agent will work</p>
          </div>
        </div>

        {/* Selected template badge */}
        {selectedTemplate && (
          <div className="flex items-center gap-3 p-3 bg-violet-600/5 border border-violet-500/20 rounded-lg mb-5">
            <span className="text-xl">{selectedTemplate.icon}</span>
            <div>
              <p className="text-sm font-medium text-white">{selectedTemplate.name}</p>
              <p className="text-xs text-gray-400">{selectedTemplate.description}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Agent Name *</label>
            <input
              className="input"
              placeholder="e.g. My Email Summarizer"
              value={agentConfig.name}
              onChange={e => update('name', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What does this agent do? (optional)"
              value={agentConfig.description}
              onChange={e => update('description', e.target.value)}
            />
          </div>

          {/* Tools */}
          {selectedTemplate?.tools?.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block">Required MCP Tools</label>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tools.map(t => (
                  <div key={t} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-300">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced params */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Max Steps</label>
            <select
              className="input"
              value={agentConfig.parameters?.max_steps || 5}
              onChange={e => update('parameters', { ...agentConfig.parameters, max_steps: parseInt(e.target.value) })}
            >
              {[3, 5, 10, 20].map(n => <option key={n} value={n}>{n} steps</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Verbosity</label>
            <select
              className="input"
              value={agentConfig.parameters?.verbosity || 'normal'}
              onChange={e => update('parameters', { ...agentConfig.parameters, verbosity: e.target.value })}
            >
              <option value="minimal">Minimal — key results only</option>
              <option value="normal">Normal — steps + result</option>
              <option value="verbose">Verbose — full trace</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between mt-7">
          <button className="btn-secondary" onClick={() => setStep(1)}>
            <ArrowLeft size={15} /> Back
          </button>
          <button
            className="btn-primary"
            onClick={() => setStep(3)}
            disabled={!agentConfig.name.trim()}
          >
            Continue <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
