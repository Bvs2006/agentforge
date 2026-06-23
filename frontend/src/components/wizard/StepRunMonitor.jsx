import { useEffect, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { agentAPI } from '../../services/api'
import { ArrowLeft, Loader, CheckCircle, XCircle, Zap } from 'lucide-react'

const STEP_LABELS = [
  { key: 'Context Loaded',       icon: '🧠', desc: 'Loading user context and memory' },
  { key: 'AI Planner',           icon: '⚡', desc: 'Analyzing task intent and creating execution pipeline' },
  { key: 'Connected Tools Run',  icon: '🔌', desc: 'Running required integration tools and collecting results' },
  { key: 'Task Execution',       icon: '✅', desc: 'Orchestrating final workflow execution and processing results' },
]

export default function StepRunMonitor() {
  const { taskInput, selectedTemplate, agentConfig, setTaskResult, setStep, setIsRunning, isRunning, addNotification } = useStore()
  const [steps, setSteps] = useState([])
  const [error, setError] = useState(null)
  const [log, setLog] = useState([])

  const addLog = (msg, type = 'info') => {
    setLog(l => [...l, { msg, type, ts: new Date().toLocaleTimeString() }])
  }

  const run = async () => {
    setIsRunning(true)
    setSteps([])
    setLog([])
    setError(null)

    addLog('Initializing AgentForge pipeline…')

    try {
      const payload = {
        task: taskInput,
        agent_id: agentConfig.name || selectedTemplate?.id,
        context: {
          template: selectedTemplate?.id,
          agent_name: agentConfig.name,
          parameters: agentConfig.parameters
        }
      }

      addLog('Sending task to AgentForge backend…')

      // Simulate step-by-step updates while waiting
      const stepInterval = setInterval(() => {
        setSteps(s => {
          if (s.length < STEP_LABELS.length) {
            const next = STEP_LABELS[s.length]
            addLog(`${next.icon} ${next.desc}`, 'step')
            return [...s, { ...next, status: 'running' }]
          }
          clearInterval(stepInterval)
          return s
        })
      }, 900)

      const res = await agentAPI.runTask(payload)
      clearInterval(stepInterval)

      // Mark all steps done
      setSteps(STEP_LABELS.map(s => ({ ...s, status: 'done' })))
      addLog('✅ Task completed successfully!', 'success')

      setTaskResult(res.data)
      addNotification('Agent task completed!', 'success')

      setTimeout(() => setStep(5), 800)

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Task failed')
      addLog(`❌ Error: ${err.message}`, 'error')
      addNotification('Task failed', 'error')
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => { run() }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRunning ? 'bg-violet-600/15 animate-pulse-slow' : 'bg-green-500/10'}`}>
            {isRunning ? <Loader size={18} className="text-violet-400 animate-spin" /> : <Zap size={18} className="text-green-400" />}
          </div>
          <div>
            <h2 className="font-semibold text-white">{isRunning ? 'Running agent…' : error ? 'Task failed' : 'Task complete!'}</h2>
            <p className="text-xs text-gray-400 truncate max-w-xs">{taskInput.slice(0, 70)}…</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-5">
          {STEP_LABELS.map((s, i) => {
            const state = steps[i]
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                state?.status === 'done'    ? 'bg-green-500/5 border border-green-500/20' :
                state?.status === 'running' ? 'bg-violet-600/5 border border-violet-500/20' :
                                              'bg-gray-900/40 border border-gray-800'
              }`}>
                <div className="text-lg w-6 text-center">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${state?.status === 'done' ? 'text-green-400' : state?.status === 'running' ? 'text-violet-400' : 'text-gray-600'}`}>
                    {s.key}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{s.desc}</p>
                </div>
                <div className="shrink-0">
                  {state?.status === 'done'    ? <CheckCircle size={16} className="text-green-400" /> :
                   state?.status === 'running' ? <Loader size={16} className="text-violet-400 animate-spin" /> :
                                                 <div className="w-4 h-4 rounded-full border border-gray-700" />}
                </div>
              </div>
            )
          })}
        </div>

        {/* Live log */}
        <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 font-mono text-xs max-h-36 overflow-y-auto">
          {log.map((l, i) => (
            <div key={i} className={`mb-0.5 ${l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-green-400' : l.type === 'step' ? 'text-violet-400' : 'text-gray-400'}`}>
              <span className="text-gray-600">[{l.ts}]</span> {l.msg}
            </div>
          ))}
          {isRunning && <span className="text-gray-400 cursor-blink">█</span>}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/30 border border-red-800/40 rounded-lg flex items-center gap-3">
            <XCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {(error || !isRunning) && (
          <div className="flex gap-3 mt-5">
            <button className="btn-secondary" onClick={() => setStep(3)}>
              <ArrowLeft size={15} /> Back
            </button>
            {error && (
              <button className="btn-primary" onClick={run}>
                <Zap size={15} /> Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
