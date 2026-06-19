'use client'
import { useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Source } from '@/lib/api'

interface SourcesPanelProps {
  sources: Source[]
}

export default function SourcesPanel({ sources }: SourcesPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (sources.length === 0) return null

  return (
    <div className="mt-3 ml-11">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors font-medium"
        aria-expanded={isOpen}
      >
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
        {sources.length} source{sources.length !== 1 ? 's' : ''} used
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {sources.map((source, index) => (
                <div
                  key={index}
                  className="flex gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                >
                  <FileText
                    size={12}
                    className="flex-none mt-0.5 text-zinc-400 dark:text-zinc-500"
                  />
                  <div className="min-w-0">
                    <p className="text-zinc-600 dark:text-zinc-300 leading-snug mb-1.5">
                      {source.content.length > 180
                        ? source.content.slice(0, 180) + '…'
                        : source.content}
                    </p>
                    {Object.keys(source.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(source.metadata).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-block bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-full px-2 py-0.5"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
