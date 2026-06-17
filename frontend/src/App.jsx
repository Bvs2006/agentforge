import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './hooks/useStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Wizard from './pages/Wizard'
import Agents from './pages/Agents'
import MCPServers from './pages/MCPServers'
import History from './pages/History'
import Settings from './pages/Settings'

function PrivateRoute({ children }) {
  const token = useStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="run" element={<Wizard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="mcp" element={<MCPServers />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
