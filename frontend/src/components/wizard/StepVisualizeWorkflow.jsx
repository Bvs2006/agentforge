import { useStore } from '../../hooks/useStore'
import { ArrowRight, ArrowLeft, GitBranch } from 'lucide-react'
import { useCallback } from 'react'

// Build workflow nodes from template
function buildWorkflow(template, taskInput) {
  const nodes = [
    { id: 'input',    label: 'User Input',       icon: '💬', color: '#0f62fe', x: 60,  y: 180 },
    { id: 'granite',  label: 'IBM Granite AI',   icon: '🧠', color: '#8a3ffc', x: 220, y: 180 },
    { id: 'langflow', label: 'Langflow Engine',  icon: '⚡', color: '#009d9a', x: 380, y: 180 },
    ...(template?.tools || []).map((t, i) => ({
      id: `mcp_${i}`, label: t.replace('_mcp', ' MCP'), icon: '🔌', color: '#f59e0b',
      x: 540, y: 120 + i * 80
    })),
    { id: 'docling',  label: 'IBM Docling',      icon: '📄', color: '#8a3ffc', x: 540, y: (template?.tools?.length || 0) * 80 + 120 },
    { id: 'output',   label: 'Results',           icon: '✅', color: '#198038', x: 700, y: 180 },
  ]

  const edges = [
    { from: 'input', to: 'granite' },
    { from: 'granite', to: 'langflow' },
    ...(template?.tools || []).map((_, i) => ({ from: 'langflow', to: `mcp_${i}` })),
    { from: 'langflow', to: 'docling' },
    ...(template?.tools || []).map((_, i) => ({ from: `mcp_${i}`, to: 'output' })),
    { from: 'docling', to: 'output' },
  ]

  return { nodes, edges }
}

export default function StepVisualizeWorkflow() {
  const { selectedTemplate, taskInput, agentConfig, setStep } = useStore()
  const { nodes, edges } = buildWorkflow(selectedTemplate, taskInput)

  const svgW = 820
  const svgH = Math.max(360, nodes.length * 60 + 60)

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Workflow Preview</h2>
        <p className="text-sm text-gray-400 mt-1">
          Here's how AgentForge will execute "{taskInput.slice(0, 60)}{taskInput.length > 60 ? '…' : ''}"
        </p>
      </div>

      <div className="card mb-5 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={15} className="text-ibm-teal" />
          <span className="text-sm font-medium text-gray-300">Execution Graph</span>
          <span className="ml-auto badge bg-gray-800 text-gray-400 border border-gray-700">{nodes.length} nodes · {edges.length} edges</span>
        </div>

        <div className="overflow-x-auto rounded-lg bg-gray-950/50 border border-gray-800/50 p-2">
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
            {/* Grid dots */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#1f2937" />
              </pattern>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#374151" />
              </marker>
            </defs>
            <rect width={svgW} height={svgH} fill="url(#grid)" />

            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodes.find(n => n.id === e.from)
              const to   = nodes.find(n => n.id === e.to)
              if (!from || !to) return null
              return (
                <line key={i}
                  x1={from.x + 70} y1={from.y + 18}
                  x2={to.x}        y2={to.y + 18}
                  stroke="#374151" strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              )
            })}

            {/* Nodes */}
            {nodes.map(n => (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                <rect width={130} height={36} rx={8}
                  fill={n.color + '18'} stroke={n.color + '60'} strokeWidth={1.5} />
                <text x={10} y={14} fontSize={13}>{n.icon}</text>
                <text x={28} y={14} fill="#e5e7eb" fontSize={10} fontFamily="Inter, sans-serif" fontWeight={500}>
                  {n.label.length > 16 ? n.label.slice(0, 15) + '…' : n.label}
                </text>
                <circle cx={115} cy={18} r={4} fill={n.color + 'aa'} />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Agent',    value: agentConfig.name || 'Unnamed' },
          { label: 'Template', value: selectedTemplate?.name || '—' },
          { label: 'Tools',    value: `${selectedTemplate?.tools?.length || 0} MCP tools` },
        ].map(({ label, value }) => (
          <div key={label} className="card py-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-sm font-medium text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button className="btn-secondary" onClick={() => setStep(2)}>
          <ArrowLeft size={15} /> Back
        </button>
        <button className="btn-primary" onClick={() => setStep(4)}>
          Run Agent <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
