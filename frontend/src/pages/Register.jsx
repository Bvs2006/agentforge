import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { authAPI } from '../services/api'
import { Zap, Mail, Lock, User, Loader } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setToken, setUser } = useStore()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await authAPI.register(form)
      setToken(res.data.access_token)
      const me = await authAPI.me()
      setUser(me.data)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const field = (key, icon, type, placeholder) => (
    <div>
      <label className="text-xs text-gray-400 font-medium mb-1.5 block capitalize">{key}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>
        <input
          className="input pl-9"
          type={type}
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          required
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/30">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Start automating with AI agents</p>
        </div>

        <div className="card">
          <form onSubmit={handle} className="space-y-4">
            {field('username', <User size={15} />, 'text', 'Your name')}
            {field('email',    <Mail size={15} />, 'email', 'you@example.com')}
            {field('password', <Lock size={15} />, 'password', '••••••••')}

            {error && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? <Loader size={15} className="animate-spin" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-400 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
