import { useStore } from '../../hooks/useStore'
import { useNavigate } from 'react-router-dom'
import { agentAPI } from '../../services/api'
import { CheckCircle, Copy, RotateCcw, Home, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function StepViewResults() {
  const { taskResult, taskInput, selectedTemplate, agentConfig, resetWizard, addNotification } = useStore()
  const navigate = useNavigate()
  const [showRaw, setShowRaw] = useState(false)
  const [saved, setSaved] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(taskResult?.output || '')
    addNotification('Copied to clipboard', 'success')
  }

  const saveAgent = async () => {
    try {
      await agentAPI.createAgent({
        template_id: selectedTemplate?.id,
        name: agentConfig.name,
        description: agentConfig.description,
        tools: selectedTemplate?.tools || [],
        parameters: agentConfig.parameters
      })
      setSaved(true)
      addNotification('Agent saved!', 'success')
    } catch {
      addNotification('Could not save agent', 'error')
    }
  }

  const plan = taskResult?.plan

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Success banner */}
      <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
        <CheckCircle size={20} className="text-green-400 shrink-0" />
        <div>
          <p className="font-semibold text-white text-sm">Task completed successfully</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Completed at {taskResult?.completed_at ? new Date(taskResult.completed_at).toLocaleTimeString() : '—'}
            {' · '}{taskResult?.steps?.length || 0} steps · Source: {taskResult?.source || '—'}
          </p>
        </div>
      </div>

      {/* Plan */}
      {plan && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">AI Planner Execution Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Intent</span>
              <span className="text-gray-200">{plan.intent}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Template</span>
              <span className="text-gray-200">{plan.agent_template}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Complexity</span>
              <span className="badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{plan.complexity}</span>
            </div>
            {plan.steps?.length > 0 && (
              <div>
                <p className="text-gray-500 mb-2">Execution steps</p>
                <ol className="space-y-1 ml-2">
                  {plan.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="text-violet-400 font-mono">{i+1}.</span> {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Output */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Output</h3>
          <button onClick={copy} className="btn-ghost text-xs py-1.5 px-2">
            <Copy size={13} /> Copy
          </button>
        </div>
        <div className="bg-gray-950/70 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto font-mono">
          {taskResult?.output || 'No output returned.'}
        </div>
      </div>

      {/* Raw JSON toggle */}
      <div className="card py-3">
        <button
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors w-full"
          onClick={() => setShowRaw(!showRaw)}
        >
          {showRaw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Raw task result (JSON)
        </button>
        {showRaw && (
          <pre className="mt-3 text-xs text-gray-500 font-mono overflow-x-auto max-h-52 overflow-y-auto bg-gray-950 p-3 rounded-lg">
            {JSON.stringify(taskResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button className="btn-secondary" onClick={() => { resetWizard(); navigate('/app/run') }}>
          <RotateCcw size={15} /> New Task
        </button>
        {!saved && agentConfig.name && (
          <button className="btn-secondary" onClick={saveAgent}>
            <Save size={15} /> Save Agent
          </button>
        )}
        {saved && (
          <span className="flex items-center gap-2 text-sm text-green-400 px-3 py-2">
            <CheckCircle size={15} /> Agent saved
          </span>
        )}
        <button className="btn-primary ml-auto" onClick={() => navigate('/app/dashboard')}>
          <Home size={15} /> Dashboard
        </button>
      </div>
    </div>
  )
}
