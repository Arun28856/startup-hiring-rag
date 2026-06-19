import Sidebar from '@/components/Sidebar'
import IngestForm from '@/components/IngestForm'
import { Upload } from 'lucide-react'

export default function IngestPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-9 h-9 bg-indigo-50 dark:bg-indigo-950 rounded-xl">
                <Upload size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Upload Data
              </h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-12">
              Add .txt or .md files to expand the knowledge base.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <IngestForm />
          </div>
        </div>
      </main>
    </div>
  )
}
