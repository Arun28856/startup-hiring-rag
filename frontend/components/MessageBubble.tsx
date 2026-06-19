'use client'
import { Sparkles, User } from 'lucide-react'
import { motion } from 'framer-motion'
import MarkdownRenderer from './MarkdownRenderer'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

export default function MessageBubble({ role, content, error }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={[
          'flex-none flex items-center justify-center w-8 h-8 rounded-full mt-0.5',
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
        ].join(' ')}
      >
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : ''}`}>
        {isUser ? (
          <div className="inline-block max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed break-words">
            {content}
          </div>
        ) : (
          <div
            className={[
              'text-sm leading-relaxed',
              error
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3'
                : 'text-zinc-800 dark:text-zinc-200',
            ].join(' ')}
          >
            {error ? content : <MarkdownRenderer content={content} />}
          </div>
        )}
      </div>
    </motion.div>
  )
}
