import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { act } from 'react'

// Mock the api module
jest.mock('@/lib/api', () => ({
  queryRAG: jest.fn(),
}))

// Reset Zustand store between tests by re-importing fresh
import { useChatStore } from '@/store/chatStore'
import ChatWindow from '@/components/ChatWindow'
import { queryRAG } from '@/lib/api'

const mockQueryRAG = queryRAG as jest.MockedFunction<typeof queryRAG>

// Helper to reset zustand store between tests
function resetStore() {
  useChatStore.setState({ messages: [], isLoading: false })
}

describe('ChatWindow', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
  })

  it('renders input and send button', () => {
    render(<ChatWindow />)

    const input = screen.getByRole('textbox', { name: /question input/i })
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Ask about startup salaries and hiring...')

    const button = screen.getByRole('button', { name: /send question/i })
    expect(button).toBeInTheDocument()
  })

  it('shows loading spinner while request is in-flight', async () => {
    // Return a promise that never resolves so we can observe the loading state
    mockQueryRAG.mockReturnValue(new Promise(() => {}))

    render(<ChatWindow />)

    const input = screen.getByRole('textbox', { name: /question input/i })
    const button = screen.getByRole('button', { name: /send question/i })

    await userEvent.type(input, 'What is the average engineer salary?')
    await userEvent.click(button)

    // Spinner should be visible while loading
    await waitFor(() => {
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    })

    // Button and input should be disabled
    expect(button).toBeDisabled()
    expect(input).toBeDisabled()
  })

  it('displays assistant answer after successful response', async () => {
    const mockResponse = {
      answer: 'The average engineer salary at Series A startups is $140,000.',
      sources: [
        {
          content: 'Software Engineer at Series A: $140k base salary',
          metadata: { role_title: 'Software Engineer', role_category: 'Engineering' },
        },
      ],
    }

    mockQueryRAG.mockResolvedValueOnce(mockResponse)

    render(<ChatWindow />)

    const input = screen.getByRole('textbox', { name: /question input/i })
    const button = screen.getByRole('button', { name: /send question/i })

    await userEvent.type(input, 'What is the average engineer salary?')
    await userEvent.click(button)

    await waitFor(() => {
      expect(
        screen.getByText('The average engineer salary at Series A startups is $140,000.')
      ).toBeInTheDocument()
    })

    // User message should also be visible
    expect(screen.getByText('What is the average engineer salary?')).toBeInTheDocument()

    // Sources summary should be visible
    expect(screen.getByText(/1 source used/i)).toBeInTheDocument()
  })

  it('displays error message when queryRAG throws a 503 error', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 503,
        data: { message: 'The AI service is currently unavailable.' },
      },
    }

    // Make axios.isAxiosError return true for our mock error
    const axios = require('axios')
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)

    mockQueryRAG.mockRejectedValueOnce(axiosError)

    render(<ChatWindow />)

    const input = screen.getByRole('textbox', { name: /question input/i })
    const button = screen.getByRole('button', { name: /send question/i })

    await userEvent.type(input, 'What is the average salary?')
    await userEvent.click(button)

    await waitFor(() => {
      expect(
        screen.getByText('The AI service is currently unavailable.')
      ).toBeInTheDocument()
    })

    // Restore
    jest.restoreAllMocks()
  })
})
