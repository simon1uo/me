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
    return 'Unavailable'
  }

  if (snapshot.status === 'empty') {
    return 'No activity'
  }

  if (snapshot.failedRequests > 0) {
    return `24h • ${formatRequestCount(snapshot.failedRequests)} failed`
  }

  return 'Live 24h'
}

function getTrendValues(timeline: UsageTimelinePoint[]) {
  return timeline.map((point) => point.totalTokens)
}

function getTopModels(models: UsageModelSummary[]) {
  return models.slice(0, 2)
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
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-x-[-8%] top-[-18%] bottom-[28%] opacity-80">
          <svg viewBox="0 0 320 160" className="h-full w-full">
            {trendPoints ? (
              <>
                <polyline
                  fill="none"
                  stroke="color-mix(in srgb, var(--atlas-accent) 16%, transparent)"
                  strokeWidth="10"
                  points={trendPoints}
                  vectorEffect="non-scaling-stroke"
                  transform="scale(1.3 1.65) translate(-18 -34)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  fill="none"
                  stroke="color-mix(in srgb, var(--atlas-accent) 44%, transparent)"
                  strokeWidth="2.4"
                  points={trendPoints}
                  vectorEffect="non-scaling-stroke"
                  transform="scale(1.3 1.65) translate(-18 -34)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
          </svg>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[56%] bg-[linear-gradient(180deg,transparent_0%,color-mix(in_srgb,var(--atlas-surface)_50%,transparent)_34%,color-mix(in_srgb,var(--atlas-surface-strong)_88%,transparent)_100%)]" />
      </div>

      <div className="relative z-10">
        <p className="atlas-insight-embedded-label">LLM Usage</p>
        <p className="mt-2 font-mono text-sm uppercase tracking-[0.08em] text-[var(--atlas-text)]">
          Usage Snapshot
        </p>
        <p className="mt-2 text-xs text-[var(--atlas-muted)]">{getStatusText(snapshot)}</p>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <div className="border border-[color-mix(in_srgb,var(--atlas-border)_74%,transparent)] bg-[color-mix(in_srgb,var(--atlas-surface-strong)_72%,transparent)] px-2.5 py-2">
            <p className="text-[0.62rem] uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Requests</p>
            <p className="mt-1 font-mono text-[1.05rem] leading-none text-[var(--atlas-text)]">
              {isFallback ? '—' : formatRequestCount(snapshot.totalRequests)}
            </p>
          </div>

          <div className="border border-[color-mix(in_srgb,var(--atlas-border)_74%,transparent)] bg-[color-mix(in_srgb,var(--atlas-surface-strong)_72%,transparent)] px-2.5 py-2">
            <p className="text-[0.62rem] uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Tokens</p>
            <p className="mt-1 font-mono text-[1.05rem] leading-none text-[var(--atlas-text)]">
              {isFallback ? '—' : formatCompactNumber(snapshot.totalTokens)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          {topModels.length ? (
            topModels.map((item) => (
              <div key={item.model} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[0.62rem] uppercase tracking-[0.08em] text-[var(--atlas-muted)]">
                  <span className="truncate">{item.model}</span>
                  <span className="shrink-0">{formatCompactNumber(item.totalTokens)}</span>
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
            <p className="text-[0.7rem] text-[var(--atlas-muted)]">
              {isFallback ? 'Metrics unavailable' : 'No model activity'}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
