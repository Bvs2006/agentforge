import { useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { agentAPI } from '../services/api'
import StepDescribeTask from '../components/wizard/StepDescribeTask'
import StepChooseTemplate from '../components/wizard/StepChooseTemplate'
import StepConfigureAgent from '../components/wizard/StepConfigureAgent'
import StepVisualizeWorkflow from '../components/wizard/StepVisualizeWorkflow'
import StepRunMonitor from '../components/wizard/StepRunMonitor'
import StepViewResults from '../components/wizard/StepViewResults'
import { BarChart3, GitBranch, Layers, MessageSquare, Play, Settings2 } from 'lucide-react'

const STEPS = [
  { label: 'Describe', icon: MessageSquare },
  { label: 'Pick Agent', icon: Layers },
  { label: 'Configure', icon: Settings2 },
  { label: 'Preview Flow', icon: GitBranch },
  { label: 'Run', icon: Play },
  { label: 'Results', icon: BarChart3 },
]

export default function Wizard() {
  const { currentStep, setStep, setTemplates, resetWizard } = useStore()

  useEffect(() => {
    resetWizard()
    agentAPI.getTemplates().then(r => setTemplates(r.data)).catch(() => {})
  }, [])

  const pages = [
    StepDescribeTask,
    StepChooseTemplate,
    StepConfigureAgent,
    StepVisualizeWorkflow,
    StepRunMonitor,
    StepViewResults,
  ]
  const Page = pages[currentStep]

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Run an agent workflow</h1>
        <p className="text-gray-400 text-sm mt-1">
          Describe the job, choose or tune an agent, preview the workflow, then execute it.
        </p>
      </div>

      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {STEPS.map(({ label, icon: Icon }, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={label} className="flex items-center shrink-0">
              <button
                onClick={() => done && setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active ? 'bg-ibm-blue text-white shadow-lg shadow-blue-900/30'
                    : done ? 'text-green-400 hover:bg-green-500/10 cursor-pointer'
                    : 'text-gray-600 cursor-default'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  active ? 'bg-white/20' : done ? 'bg-green-500/20' : 'bg-gray-800'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 ${i < currentStep ? 'bg-green-600' : 'bg-gray-800'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="animate-fade-in">
        <Page />
      </div>
    </div>
  )
}
