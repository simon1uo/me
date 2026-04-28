'use client'

import { useEffect, useState } from 'react'

import type { UsageModelSummary, UsageSnapshot, UsageTimelinePoint } from 'app/utils/llm-usage'

type UsageCardSnapshot = UsageSnapshot | (Omit<UsageSnapshot, 'status'> & { status: 'fallback' })

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatRequestCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function buildTrendPoints(values: number[], width: number, height: number, padding: number) {
  if (!values.length) {
    return ''
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(1, max - min)
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  return values
    .map((value, index) => {
      const x = padding + (index / Math.max(1, values.length - 1)) * innerWidth
      const y = padding + innerHeight - ((value - min) / range) * innerHeight
      return `${x},${y}`
    })
    .join(' ')
}

function buildFallbackState(): UsageCardSnapshot {
  return {
    status: 'fallback',
    window: '24h',
    totalRequests: 0,
    totalTokens: 0,
    successCount: 0,
    failedRequests: 0,
    models: [],
    timeline: [],
  }
}

function getStatusText(snapshot: UsageCardSnapshot | null) {
  if (!snapshot || snapshot.status === 'fallback') {
    return 'Usage unavailable'
  }

  if (snapshot.status === 'empty') {
    return 'No model activity in the last 24 hours'
  }

  if (snapshot.failedRequests > 0) {
    return `Live last 24h usage • ${formatRequestCount(snapshot.failedRequests)} failed`
  }

  return 'Live last 24h usage'
}

function getTrendValues(timeline: UsageTimelinePoint[]) {
  return timeline.map((point) => point.totalTokens)
}

function getTopModels(models: UsageModelSummary[]) {
  return models.slice(0, 3)
}

export function LlmUsageCard() {
  const [snapshot, setSnapshot] = useState<UsageCardSnapshot | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUsage() {
      try {
        const response = await fetch('/api/llm/usage')

        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`)
        }

        const payload = (await response.json()) as UsageCardSnapshot

        if (!cancelled) {
          setSnapshot(payload)
        }
      } catch {
        if (!cancelled) {
          setSnapshot(buildFallbackState())
        }
      }
    }

    loadUsage()

    return () => {
      cancelled = true
    }
  }, [])

  const trendPoints = buildTrendPoints(getTrendValues(snapshot?.timeline || []), 240, 86, 10)
  const topModels = getTopModels(snapshot?.models || [])
  const isFallback = !snapshot || snapshot.status === 'fallback'

  return (
    <article className="atlas-insight-card">
      <p className="atlas-insight-embedded-label">LLM Usage</p>
      <p className="mt-2 font-mono text-sm uppercase tracking-[0.08em] text-[var(--atlas-text)]">
        Requests • Tokens • Models
      </p>
      <p className="mt-2 text-xs text-[var(--atlas-muted)]">{getStatusText(snapshot)}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="border border-[color-mix(in_srgb,var(--atlas-border)_74%,transparent)] bg-[color-mix(in_srgb,var(--atlas-surface-strong)_72%,transparent)] px-3 py-3">
          <p className="text-[0.62rem] uppercase tracking-[0.12em] text-[var(--atlas-muted)]">Total Requests</p>
          <p className="mt-2 font-mono text-xl text-[var(--atlas-text)]">
            {isFallback ? '—' : formatRequestCount(snapshot.totalRequests)}
          </p>
        </div>

        <div className="border border-[color-mix(in_srgb,var(--atlas-border)_74%,transparent)] bg-[color-mix(in_srgb,var(--atlas-surface-strong)_72%,transparent)] px-3 py-3">
          <p className="text-[0.62rem] uppercase tracking-[0.12em] text-[var(--atlas-muted)]">Total Tokens</p>
          <p className="mt-2 font-mono text-xl text-[var(--atlas-text)]">
            {isFallback ? '—' : formatCompactNumber(snapshot.totalTokens)}
          </p>
        </div>
      </div>

      <svg
        viewBox="0 0 240 86"
        className="mt-4 h-[86px] w-full border border-[color-mix(in_srgb,var(--atlas-border)_74%,transparent)] bg-[color-mix(in_srgb,var(--atlas-surface-strong)_72%,transparent)]"
        role="img"
        aria-label="LLM token trend chart"
      >
        {trendPoints ? (
          <polyline
            fill="none"
            stroke="var(--atlas-accent)"
            strokeWidth="1.6"
            points={trendPoints}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>

      <div className="mt-4 space-y-2">
        {topModels.length ? (
          topModels.map((item) => (
            <div key={item.model} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--atlas-muted)]">
                <span className="truncate">{item.model}</span>
                <span className="shrink-0">
                  {formatRequestCount(item.totalRequests)} req • {formatCompactNumber(item.totalTokens)}
                </span>
              </div>
              <div className="h-1.5 border border-[color-mix(in_srgb,var(--atlas-border)_74%,transparent)] bg-transparent">
                <div
                  className="h-full bg-[color-mix(in_srgb,var(--atlas-accent)_46%,transparent)]"
                  style={{ width: `${Math.max(item.share * 100, 6)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-[var(--atlas-muted)]">
            {isFallback ? 'Live usage metrics are temporarily unavailable.' : 'No model activity to display.'}
          </p>
        )}
      </div>
    </article>
  )
}
