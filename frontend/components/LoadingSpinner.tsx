'use client'

export default function LoadingSpinner() {
  return (
    <div role="status" aria-label="Loading" className="flex items-center gap-1 py-1">
      <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
