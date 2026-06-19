'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react'
import { ingestDocument } from '@/lib/api'

interface FormValues {
  file: FileList
}

interface IngestResult {
  chunksStored: number
  message: string
}

export default function IngestForm() {
  const [isUploading, setIsUploading] = useState(false)
  const [successResult, setSuccessResult] = useState<IngestResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>()

  const selectedFile = watch('file')?.[0]

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        typeof text === 'string' ? resolve(text) : reject(new Error('Failed to read file.'))
      }
      reader.onerror = () => reject(new Error('FileReader error'))
      reader.readAsText(file)
    })

  const getMimeType = (file: File): string => {
    if (file.type) return file.type
    if (file.name.endsWith('.md')) return 'text/markdown'
    return 'text/plain'
  }

  const onSubmit = async ({ file }: FormValues) => {
    setSuccessResult(null)
    setErrorMessage(null)

    const f = file[0]
    if (!f) { setErrorMessage('Please select a file.'); return }

    setIsUploading(true)

    try {
      const content = await readFileAsText(f)
      const mimeType = getMimeType(f)
      const result = await ingestDocument(f.name, content, mimeType)
      setSuccessResult({ chunksStored: result.chunksStored, message: result.message })
      reset()
    } catch (err: unknown) {
      let message = 'Upload failed. Please try again.'

      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const serverMessage = err.response?.data?.message

        if (status === 400) {
          message =
            typeof serverMessage === 'string'
              ? serverMessage
              : Array.isArray(serverMessage)
              ? serverMessage.join(', ')
              : 'Invalid file content.'
        } else if (status === 503) {
          message =
            typeof serverMessage === 'string'
              ? serverMessage
              : 'The embeddings service is temporarily unavailable.'
        } else if (!err.response) {
          message = 'Cannot reach the server. Make sure the backend is running on port 3001.'
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setErrorMessage(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Drop zone */}
      <label
        htmlFor="file-upload"
        className={[
          'flex flex-col items-center justify-center gap-3 w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
          errors.file
            ? 'border-red-400 bg-red-50 dark:bg-red-950'
            : isUploading
            ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 cursor-not-allowed'
            : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
        ].join(' ')}
      >
        <UploadCloud
          size={28}
          className={
            errors.file
              ? 'text-red-400'
              : 'text-zinc-400 dark:text-zinc-500'
          }
        />
        <div className="text-center">
          {selectedFile ? (
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {selectedFile.name}
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Click to select a file
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Supported: .txt, .md
              </p>
            </>
          )}
        </div>
        <input
          id="file-upload"
          type="file"
          accept=".txt,.md"
          disabled={isUploading}
          className="sr-only"
          {...register('file', {
            required: 'Please select a file to upload.',
            validate: (files) => {
              const file = files?.[0]
              if (!file) return 'Please select a file to upload.'
              const ext = file.name.split('.').pop()?.toLowerCase()
              if (ext !== 'txt' && ext !== 'md') return 'Only .txt and .md files are supported.'
              return true
            },
          })}
        />
      </label>
      {errors.file && (
        <p className="text-xs text-red-500 -mt-3">{errors.file.message}</p>
      )}

      <button
        type="submit"
        disabled={isUploading}
        className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading…' : 'Upload to Knowledge Base'}
      </button>

      {successResult && (
        <div
          role="status"
          aria-live="polite"
          className="flex gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-4 py-3 text-sm"
        >
          <CheckCircle size={16} className="flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-300">Upload successful!</p>
            <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">
              {successResult.chunksStored} chunk{successResult.chunksStored !== 1 ? 's' : ''} stored
              in the knowledge base.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm"
        >
          <AlertCircle size={16} className="flex-none text-red-500 dark:text-red-400 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">Upload failed</p>
            <p className="text-red-700 dark:text-red-400 text-xs mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </form>
  )
}
