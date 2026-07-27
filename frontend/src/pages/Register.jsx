import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { Zap, User, Loader } from 'lucide-react'

export default function Register() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUsername } = useStore()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/auth/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      })
      if (!res.ok) throw new Error('Failed to set username')
      setUsername(username.trim())
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/30">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Choose a username</h1>
          <p className="text-gray-400 text-sm mt-1">Pick a name to get started</p>
        </div>

        <div className="card">
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  className="input pl-9"
                  type="text"
                  placeholder="agent_master"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  minLength={2}
                  maxLength={32}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? <Loader size={15} className="animate-spin" /> : null}
              {loading ? 'Joining\u2026' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}