import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('agentforge_token') || null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('agentforge_token', token)
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('agentforge_token')
    set({ user: null, token: null })
  },

  // Navigation
  currentStep: 0,         // 0-5 wizard steps
  setStep: (n) => set({ currentStep: n }),

  // Task wizard state
  taskInput: '',
  setTaskInput: (v) => set({ taskInput: v }),

  selectedTemplate: null,
  setSelectedTemplate: (t) => set({ selectedTemplate: t }),

  agentConfig: { name: '', description: '', tools: [], parameters: {} },
  setAgentConfig: (c) => set({ agentConfig: c }),

  taskResult: null,
  setTaskResult: (r) => set({ taskResult: r }),

  isRunning: false,
  setIsRunning: (v) => set({ isRunning: v }),

  // Templates cache
  templates: [],
  setTemplates: (t) => set({ templates: t }),

  // MCP servers cache
  mcpServers: [],
  setMCPServers: (s) => set({ mcpServers: s }),

  // Agents list
  agents: [],
  setAgents: (a) => set({ agents: a }),

  // Platform status
  status: null,
  setStatus: (s) => set({ status: s }),

  // Notifications
  notifications: [],
  addNotification: (msg, type = 'info') => {
    const id = Date.now()
    set(s => ({ notifications: [...s.notifications, { id, msg, type }] }))
    setTimeout(() => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })), 4000)
  },

  // Reset wizard
  resetWizard: () => set({
    currentStep: 0,
    taskInput: '',
    selectedTemplate: null,
    agentConfig: { name: '', description: '', tools: [], parameters: {} },
    taskResult: null,
    isRunning: false,
  })
}))
