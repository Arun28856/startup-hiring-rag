import { create } from 'zustand'
import { Source } from '@/lib/api'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  error?: boolean
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  addMessage: (msg: Message) => void
  setLoading: (v: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (v) => set({ isLoading: v }),
  clearMessages: () => set({ messages: [] }),
}))
