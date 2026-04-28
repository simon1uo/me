import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LlmUsageCard } from 'app/components/llm-usage-card'

const fetchMock = vi.fn()

describe('LlmUsageCard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('renders ready state data from the local route', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ready',
        window: '24h',
        totalRequests: 1797,
        totalTokens: 192437436,
        successCount: 1775,
        failedRequests: 22,
        models: [
          {
            model: 'gpt-5.3-codex',
            totalRequests: 1071,
            totalTokens: 122334776,
            share: 0.596,
          },
        ],
        timeline: [
          { hour: '2026-04-27T13:00:00+08:00', totalTokens: 1000 },
          { hour: '2026-04-27T14:00:00+08:00', totalTokens: 2000 },
        ],
      }),
    })

    render(<LlmUsageCard />)

    await waitFor(() => expect(screen.getByText('1,797')).toBeInTheDocument())
    expect(screen.getByText('192.4M')).toBeInTheDocument()
    expect(screen.getByText(/Live last 24h usage/)).toBeInTheDocument()
    expect(screen.getByText(/gpt-5.3-codex/)).toBeInTheDocument()
  })

  it('renders fallback copy when the route request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network failed'))

    render(<LlmUsageCard />)

    await waitFor(() => expect(screen.getByText('Usage unavailable')).toBeInTheDocument())
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders empty-state copy when there is no model activity', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'empty',
        window: '24h',
        totalRequests: 0,
        totalTokens: 0,
        successCount: 0,
        failedRequests: 0,
        models: [],
        timeline: [],
      }),
    })

    render(<LlmUsageCard />)

    await waitFor(() =>
      expect(screen.getByText('No model activity in the last 24 hours')).toBeInTheDocument()
    )
  })
})
