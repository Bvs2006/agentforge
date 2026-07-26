import axios from 'axios'

const api = axios.create({ baseURL: '' })

// Attach token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('agentforge_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-redirect on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('agentforge_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
}

// Agent
export const agentAPI = {
  runTask:      (data)        => api.post('/agent/run', data),
  getTemplates: ()            => api.get('/agent/templates'),
  createAgent:  (data)        => api.post('/agent/agents', data),
  listAgents:   ()            => api.get('/agent/agents'),
  deleteAgent:  (name)        => api.delete(`/agent/agents/${name}`),
  getHistory:   (agentId)     => api.get('/agent/history', { params: agentId ? { agent_id: agentId } : {} }),
  clearHistory: ()            => api.delete('/agent/history'),
  getTask:      (id)          => api.get(`/agent/tasks/${id}`),
  uploadDoc:    (formData)    => api.post('/agent/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Knowledge Agents
export const knowledgeAPI = {
  createAgent:       (data)                           => api.post('/knowledge/agents', data),
  listAgents:        ()                               => api.get('/knowledge/agents'),
  getAgent:          (id)                             => api.get(`/knowledge/agents/${id}`),
  deleteAgent:       (id)                             => api.delete(`/knowledge/agents/${id}`),
  getAgentStatus:    (id)                             => api.get(`/knowledge/agents/${id}/status`),
  addSource:         (agentId, data)                  => api.post(`/knowledge/agents/${agentId}/sources`, data),
  listSources:       (agentId)                        => api.get(`/knowledge/agents/${agentId}/sources`),
  deleteSource:      (agentId, sourceId)              => api.delete(`/knowledge/agents/${agentId}/sources/${sourceId}`),
  ingestSource:      (agentId, sourceId)              => api.post(`/knowledge/agents/${agentId}/sources/${sourceId}/ingest`),
  uploadSourceFile:  (agentId, formData)              => api.post(`/knowledge/agents/${agentId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  chat:              (agentId, data)                  => api.post(`/knowledge/agents/${agentId}/chat`, data),
  search:            (agentId, query, topK)           => api.get(`/knowledge/agents/${agentId}/search`, { params: { q: query, top_k: topK || 5 } }),
  getStatus:         ()                               => api.get('/knowledge/status'),
}

// MCP & Platform
export const platformAPI = {
  getMCPServers: ()                               => api.get('/api/v1/mcp/servers'),
  getMCPTools:   ()                               => api.get('/api/v1/mcp/tools'),
  getServerTools:(id)                             => api.get(`/api/v1/mcp/servers/${id}/tools`),
  executeTool:   (server, tool, args)             => api.post(`/api/v1/mcp/execute?server_id=${server}&tool_name=${tool}`, args),
  getContext:    ()                               => api.get('/api/v1/context'),
  getStatus:     ()                               => api.get('/api/v1/status'),
}

export default api
