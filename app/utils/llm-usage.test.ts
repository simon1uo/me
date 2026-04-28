import { describe, expect, it } from 'vitest'

import {
  aggregateUsagePayload,
  buildEmptyUsageSnapshot,
  type UsageApiPayload,
} from 'app/utils/llm-usage'

const payload: UsageApiPayload = {
  failed_requests: 22,
  usage: {
    total_requests: 1797,
    success_count: 1775,
    failure_count: 22,
    total_tokens: 192437436,
    apis: {
      first: {
        total_requests: 1100,
        total_tokens: 130000000,
        models: {
          'gpt-5.3-codex': {
            total_requests: 1000,
            total_tokens: 120000000,
            details: [
              {
                timestamp: '2026-04-27T13:10:00+08:00',
                tokens: { total_tokens: 1000 },
              },
              {
                timestamp: '2026-04-27T14:10:00+08:00',
                tokens: { total_tokens: 2000 },
              },
            ],
          },
          'gpt-4.1': {
            total_requests: 100,
            total_tokens: 10000000,
            details: [
              {
                timestamp: '2026-04-27T14:40:00+08:00',
                tokens: { total_tokens: 500 },
              },
            ],
          },
        },
      },
      second: {
        total_requests: 697,
        total_tokens: 62437436,
        models: {
          'gpt-5.3-codex': {
            total_requests: 71,
            total_tokens: 2334776,
            details: [
              {
                timestamp: '2026-04-27T15:00:00+08:00',
                tokens: { total_tokens: 2500 },
              },
            ],
          },
          'gpt-4.1-mini': {
            total_requests: 626,
            total_tokens: 60102660,
            details: [
              {
                timestamp: '2026-04-27T16:00:00+08:00',
                tokens: { total_tokens: 3000 },
              },
            ],
          },
        },
      },
    },
  },
}

describe('aggregateUsagePayload', () => {
  it('merges model totals across api keys and sorts models by total requests', () => {
    const snapshot = aggregateUsagePayload(payload, new Date('2026-04-28T12:00:00+08:00'))

    expect(snapshot.totalRequests).toBe(1797)
    expect(snapshot.totalTokens).toBe(192437436)
    expect(snapshot.failedRequests).toBe(22)
    expect(snapshot.models.map((item) => item.model)).toEqual([
      'gpt-5.3-codex',
      'gpt-4.1-mini',
      'gpt-4.1',
    ])
    expect(snapshot.models[0]).toMatchObject({
      model: 'gpt-5.3-codex',
      totalRequests: 1071,
      totalTokens: 122334776,
    })
    expect(snapshot.models[0].share).toBeCloseTo(1071 / 1797, 6)
  })

  it('builds exactly 24 hourly timeline buckets and sums tokens into matching hours', () => {
    const snapshot = aggregateUsagePayload(payload, new Date('2026-04-28T12:00:00+08:00'))

    expect(snapshot.timeline).toHaveLength(24)
    expect(snapshot.timeline.some((entry) => entry.totalTokens === 3000)).toBe(true)
    expect(snapshot.timeline.some((entry) => entry.totalTokens === 2500)).toBe(true)
  })

  it('returns an empty snapshot when there are no models', () => {
    expect(buildEmptyUsageSnapshot()).toEqual({
      status: 'empty',
      window: '24h',
      totalRequests: 0,
      totalTokens: 0,
      successCount: 0,
      failedRequests: 0,
      models: [],
      timeline: [],
    })
  })

  it('ignores details outside the 24 hour window', () => {
    const snapshot = aggregateUsagePayload(
      {
        usage: {
          total_requests: 1,
          success_count: 1,
          failure_count: 0,
          total_tokens: 123,
          apis: {
            only: {
              models: {
                'gpt-4.1': {
                  total_requests: 1,
                  total_tokens: 123,
                  details: [
                    {
                      timestamp: '2026-04-26T10:00:00+08:00',
                      tokens: { total_tokens: 123 },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      new Date('2026-04-28T12:00:00+08:00')
    )

    expect(snapshot.timeline.every((entry) => entry.totalTokens === 0)).toBe(true)
  })
})
