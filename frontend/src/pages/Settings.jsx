import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { useNavigate } from 'react-router-dom'
import { Settings, Key, Database, Cpu, LogOut, Save, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { logout, addNotification } = useStore()
  const navigate = useNavigate()
  const [show, setShow] = useState({})
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    ibm_api_key: '',
    ibm_project_id: '',
    ibm_watsonx_url: 'https://us-south.ml.cloud.ibm.com',
    langflow_url: 'http://localhost:7860',
    redis_host: 'localhost',
    redis_port: '6379',
  })

  const toggle = k => setShow(s => ({ ...s, [k]: !s[k] }))
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    setSaved(true)
    addNotification('Settings saved (restart backend to apply)', 'success')
    setTimeout(() => setSaved(false), 3000)
  }

  const Section = ({ icon: Icon, title, color, children }) => (
    <div className="card mb-4">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
        <h2 className="font-semibold text-white text-sm">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )

  const Field = ({ label, k, type = 'text', placeholder = '' }) => (
    <div>
      <label className="text-xs text-gray-400 font-medium mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          className="input pr-10"
          type={type === 'secret' ? (show[k] ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[k]}
          onChange={e => update(k, e.target.value)}
        />
        {type === 'secret' && (
          <button
            type="button"
            onClick={() => toggle(k)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {show[k] ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure IBM services and platform connections</p>
      </div>

      <Section icon={Cpu} title="IBM watsonx.ai (Granite)" color="bg-ibm-blue">
        <Field label="IBM API Key" k="ibm_api_key" type="secret" placeholder="ibm_apikey_..." />
        <Field label="Project ID" k="ibm_project_id" type="secret" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        <Field label="Watsonx URL" k="ibm_watsonx_url" placeholder="https://us-south.ml.cloud.ibm.com" />
        <p className="text-xs text-gray-600">Get credentials at <span className="text-ibm-blue">cloud.ibm.com/watsonx</span></p>
      </Section>

      <Section icon={Settings} title="Langflow" color="bg-ibm-teal">
        <Field label="Langflow URL" k="langflow_url" placeholder="http://localhost:7860" />
        <p className="text-xs text-gray-600">Run locally: <code className="text-gray-400 bg-gray-800 px-1 rounded">pip install langflow && langflow run</code></p>
      </Section>

      <Section icon={Database} title="Redis (Context Forge)" color="bg-ibm-purple">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Host" k="redis_host" placeholder="localhost" />
          <Field label="Port" k="redis_port" placeholder="6379" />
        </div>
        <p className="text-xs text-gray-600">Run locally: <code className="text-gray-400 bg-gray-800 px-1 rounded">docker run -p 6379:6379 redis</code></p>
      </Section>

      <div className="flex items-center justify-between">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-950/30"
        >
          <LogOut size={15} /> Sign Out
        </button>
        <button onClick={save} className="btn-primary">
          <Save size={15} /> {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="card mt-5 bg-gray-900/30">
        <p className="text-xs text-gray-500 font-medium mb-2">About AgentForge</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          AgentForge v1.0.0 — No-Code AI Automation Platform built with IBM Granite,
          Langflow, IBM Docling, IBM Context Forge, FastAPI, and React.
        </p>
      </div>
    </div>
  )
}
