'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, MessageSquare, Upload } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { href: '/', icon: MessageSquare, label: 'Chat' },
  { href: '/ingest', icon: Upload, label: 'Upload Data' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-center w-7 h-7 bg-indigo-600 rounded-lg">
          <Sparkles size={13} className="text-white" />
        </div>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight text-sm">
          Hiring Intel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
              ].join(' ')}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-none" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            llama-3.1-8b · Groq
          </span>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
