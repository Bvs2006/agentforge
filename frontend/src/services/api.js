import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000' })

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
  getHistory:   ()            => api.get('/agent/history'),
  clearHistory: ()            => api.delete('/agent/history'),
  getTask:      (id)          => api.get(`/agent/tasks/${id}`),
  uploadDoc:    (formData)    => api.post('/agent/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
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
