import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './hooks/useStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Wizard from './pages/Wizard'
import Agents from './pages/Agents'
import MCPServers from './pages/MCPServers'
import History from './pages/History'
import Settings from './pages/Settings'
import ChatPlayground from './pages/ChatPlayground'
import KnowledgeWorkspace from './pages/KnowledgeWorkspace'
import KnowledgeAgentBuilder from './pages/KnowledgeAgentBuilder'
import KnowledgeAgentChat from './pages/KnowledgeAgentChat'
import KnowledgeSourceManager from './pages/KnowledgeSourceManager'
import KnowledgeSearchPanel from './pages/KnowledgeSearchPanel'
import KnowledgeStatusDashboard from './pages/KnowledgeStatusDashboard'
import Landing from './pages/Landing'

function PrivateRoute({ children }) {
  const username = useStore(s => s.username)
  return username ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="run" element={<Wizard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="chat/:agentName" element={<ChatPlayground />} />
          <Route path="mcp" element={<MCPServers />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
          <Route path="knowledge" element={<KnowledgeWorkspace />} />
          <Route path="knowledge/new" element={<KnowledgeAgentBuilder />} />
          <Route path="knowledge/:agentId" element={<KnowledgeAgentChat />} />
          <Route path="knowledge/:agentId/sources" element={<KnowledgeSourceManager />} />
          <Route path="knowledge/search" element={<KnowledgeSearchPanel />} />
          <Route path="knowledge/status" element={<KnowledgeStatusDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
