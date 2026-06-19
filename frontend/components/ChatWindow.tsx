'use client'

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { Send, Trash2, Sparkles } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { queryRAG } from '@/lib/api'
import MessageBubble from './MessageBubble'
import SourcesPanel from './SourcesPanel'
import LoadingSpinner from './LoadingSpinner'
import ThemeToggle from './ThemeToggle'

interface FormValues {
  question: string
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const EXAMPLE_PROMPTS = [
  'What salary should I expect as a backend engineer at a Series A startup?',
  'What equity is typical for early hires at Indian startups?',
  'What skills do B2B SaaS startups look for in presales engineers?',
]

export default function ChatWindow() {
  const { messages, isLoading, addMessage, setLoading, clearMessages } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>()

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, isLoading])

  const onSubmit = async ({ question }: FormValues) => {
    if (isLoading) return

    reset()
    addMessage({ id: generateId(), role: 'user', content: question })
    setLoading(true)

    try {
      const response = await queryRAG(question)
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
      })
    } catch (err: unknown) {
      let errorMessage = 'Something went wrong. Please try again.'

      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const serverMessage = err.response?.data?.message

        if (status === 400) {
          errorMessage =
            typeof serverMessage === 'string'
              ? serverMessage
              : Array.isArray(serverMessage)
              ? serverMessage.join(', ')
              : 'Invalid question. Please enter at least 3 characters.'
        } else if (status === 503) {
          errorMessage =
            typeof serverMessage === 'string'
              ? serverMessage
              : 'The AI service is temporarily unavailable. Please try again later.'
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'The request timed out. Please try again.'
        } else if (!err.response) {
          errorMessage =
            'Cannot reach the server. Make sure the backend is running on port 3001.'
        }
      }

      addMessage({ id: generateId(), role: 'assistant', content: errorMessage, error: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile top bar — hidden on md+ (sidebar handles nav there) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-md">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Hiring Intel
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex items-center justify-center w-14 h-14 bg-indigo-50 dark:bg-indigo-950 rounded-2xl mb-4">
              <Sparkles size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              What would you like to know?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
              Ask about startup salaries, equity, hiring trends, and compensation in the Indian
              market.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-md">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setValue('question', prompt)}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble role={msg.role} content={msg.content} error={msg.error} />
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <SourcesPanel sources={msg.sources} />
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Sparkles size={14} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <div className="pt-1">
                  <LoadingSpinner />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div
              className={[
                'flex items-center gap-2 rounded-2xl border px-4 py-2.5 bg-white dark:bg-zinc-900 transition-colors',
                errors.question
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-zinc-300 dark:border-zinc-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950',
              ].join(' ')}
            >
              <input
                {...register('question', {
                  required: 'Please enter a question.',
                  minLength: { value: 3, message: 'Question must be at least 3 characters.' },
                })}
                type="text"
                placeholder="Ask about startup salaries and hiring..."
                aria-label="Question input"
                disabled={isLoading}
                className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 disabled:cursor-not-allowed py-1"
              />
              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearMessages}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Clear chat"
                    title="Clear chat"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-label="Send question"
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
            {errors.question && (
              <p className="mt-1.5 text-xs text-red-500 px-1">{errors.question.message}</p>
            )}
          </form>
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-3">
            Responses are based on ingested startup data only.
          </p>
        </div>
      </div>
    </div>
  )
}
