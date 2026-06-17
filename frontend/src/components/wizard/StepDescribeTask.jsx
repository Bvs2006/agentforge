import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { MessageSquare, Sparkles, ArrowRight } from 'lucide-react'

const EXAMPLES = [
  'Send an email summary of my GitHub issues to my team',
  'Read the uploaded PDF and create a Google Sheet with the key data',
  'Check my Gmail inbox and create Notion tasks for action items',
  'Summarize the latest issues in my repo and post to Slack #dev',
  'Analyze this document and write a report with bullet points',
]

export default function StepDescribeTask() {
  const { taskInput, setTaskInput, setStep } = useStore()
  const [focused, setFocused] = useState(false)

  const next = () => { if (taskInput.trim().length >= 5) setStep(1) }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-ibm-blue/15 flex items-center justify-center">
            <MessageSquare size={18} className="text-ibm-blue" />
          </div>
          <div>
            <h2 className="font-semibold text-white">What do you want to automate?</h2>
            <p className="text-xs text-gray-400">Describe your task in plain English</p>
          </div>
        </div>

        <textarea
          className={`w-full bg-gray-900 border rounded-xl p-4 text-gray-100 placeholder-gray-600 resize-none text-sm leading-relaxed focus:outline-none transition-all duration-200 ${
            focused ? 'border-ibm-blue ring-1 ring-ibm-blue/30' : 'border-gray-700'
          }`}
          rows={5}
          placeholder="e.g. Read my Gmail inbox, find emails about project deadlines, and create tasks in Notion…"
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) next() }}
        />
        <p className="text-xs text-gray-600 mt-1.5">Ctrl+Enter to continue · {taskInput.length} chars</p>

        {/* Examples */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} className="text-ibm-purple" />
            <span className="text-xs text-gray-400 font-medium">Example tasks</span>
          </div>
          <div className="space-y-2">
            {EXAMPLES.map((ex, i) => (
              <button key={i}
                onClick={() => setTaskInput(ex)}
                className="w-full text-left text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 px-3 py-2 rounded-lg transition-all border border-transparent hover:border-gray-700/50">
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            className="btn-primary"
            onClick={next}
            disabled={taskInput.trim().length < 5}
          >
            Continue <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
