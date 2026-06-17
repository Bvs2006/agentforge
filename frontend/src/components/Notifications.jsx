import { useStore } from '../hooks/useStore'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={16} className="text-green-400" />,
  error:   <AlertCircle size={16} className="text-red-400" />,
  info:    <Info size={16} className="text-blue-400" />,
}

export default function Notifications() {
  const notifications = useStore(s => s.notifications)

  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
      {notifications.map(n => (
        <div key={n.id}
          className="animate-slide-up glass rounded-lg px-4 py-3 flex items-center gap-3 shadow-xl min-w-64 max-w-80 pointer-events-auto">
          {icons[n.type] || icons.info}
          <p className="text-sm text-gray-200 flex-1">{n.msg}</p>
        </div>
      ))}
    </div>
  )
}
