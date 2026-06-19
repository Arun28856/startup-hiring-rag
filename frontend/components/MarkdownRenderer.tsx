'use client'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  pre: ({ children }) => <div className="mb-2">{children}</div>,
  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
  code: ({ children, className }) => {
    const isBlock = !!className
    return isBlock ? (
      <code className="block bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto mb-2 w-full">
        {children}
      </code>
    ) : (
      <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    )
  },
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>
}
