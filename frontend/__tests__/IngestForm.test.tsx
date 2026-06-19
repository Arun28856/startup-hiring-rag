import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock the api module
jest.mock('@/lib/api', () => ({
  ingestDocument: jest.fn(),
}))

import IngestForm from '@/components/IngestForm'
import { ingestDocument } from '@/lib/api'

const mockIngestDocument = ingestDocument as jest.MockedFunction<typeof ingestDocument>

/**
 * Helper: create a mock File and wire up a FileReader stub so that
 * readAsText() synchronously fires the onload callback with the given text.
 */
function mockFileReaderWithText(text: string) {
  const originalFileReader = global.FileReader

  class MockFileReader {
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null
    onerror: ((event: ProgressEvent<FileReader>) => void) | null = null
    result: string | null = null

    readAsText(_file: Blob) {
      this.result = text
      if (this.onload) {
        const event = {
          target: { result: text },
        } as unknown as ProgressEvent<FileReader>
        // Use queueMicrotask so it fires after the current call stack
        queueMicrotask(() => this.onload!(event))
      }
    }
  }

  // @ts-expect-error — replacing global for test purposes
  global.FileReader = MockFileReader

  return () => {
    global.FileReader = originalFileReader
  }
}

describe('IngestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders file input with correct label', () => {
    render(<IngestForm />)

    // Drop zone label text
    expect(screen.getByText('Click to select a file')).toBeInTheDocument()

    // The input is inside the label (implicit association)
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('type', 'file')
    expect(fileInput).toHaveAttribute('accept', '.txt,.md')
  })

  it('shows success message after successful ingest', async () => {
    const restoreFileReader = mockFileReaderWithText('# Salary Data\n\nEngineer: $140k')

    mockIngestDocument.mockResolvedValueOnce({
      message: 'Ingested successfully',
      chunksStored: 5,
    })

    render(<IngestForm />)

    const file = new File(['# Salary Data\n\nEngineer: $140k'], 'salaries.md', {
      type: 'text/markdown',
    })

    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    await userEvent.upload(fileInput, file)

    const uploadButton = screen.getByRole('button', { name: /upload/i })
    await userEvent.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText('Upload successful!')).toBeInTheDocument()
      expect(screen.getByText(/5 chunks stored/i)).toBeInTheDocument()
    })

    restoreFileReader()
  })

  it('shows error message when ingest fails', async () => {
    const restoreFileReader = mockFileReaderWithText('some content')

    const axiosError = {
      isAxiosError: true,
      response: {
        status: 503,
        data: { message: 'Embeddings service is unreachable.' },
      },
    }

    const axios = require('axios')
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)

    mockIngestDocument.mockRejectedValueOnce(axiosError)

    render(<IngestForm />)

    const file = new File(['some content'], 'data.txt', { type: 'text/plain' })

    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    await userEvent.upload(fileInput, file)

    const uploadButton = screen.getByRole('button', { name: /upload/i })
    await userEvent.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
      expect(screen.getByText('Embeddings service is unreachable.')).toBeInTheDocument()
    })

    jest.restoreAllMocks()
    restoreFileReader()
  })
})
