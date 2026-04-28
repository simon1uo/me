'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  type CommitDayCell,
  buildCommitHeatmap,
  buildFallbackContributionDays,
  type ContributionDay,
  toRecentContributionDays,
} from 'app/utils/heatmap'

type GitHubActivityHeatmapProps = {
  username: string | null
  fallbackWeeks: CommitDayCell[][]
}

type ContributionsApiResponse = {
  contributions?: ContributionDay[]
}

export function GitHubActivityHeatmap({ username, fallbackWeeks }: GitHubActivityHeatmapProps) {
  const [weeks, setWeeks] = useState(fallbackWeeks)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>(username ? 'loading' : 'fallback')

  useEffect(() => {
    const safeUsername = username

    if (typeof safeUsername !== 'string' || !safeUsername) {
      return
    }
    const encodedUsername = encodeURIComponent(safeUsername)

    let cancelled = false

    async function loadContributions() {
      try {
        const response = await fetch(`/api/github/contributions?username=${encodedUsername}`)

        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`)
        }

        const payload = (await response.json()) as ContributionsApiResponse
        const contributions = Array.isArray(payload.contributions) ? payload.contributions : []

        if (!contributions.length) {
          throw new Error('Missing contributions data')
        }

        if (!cancelled) {
          setWeeks(buildCommitHeatmap(toRecentContributionDays(contributions)))
          setStatus('ready')
        }
      } catch {
        if (!cancelled) {
          setWeeks(buildCommitHeatmap(buildFallbackContributionDays()))
          setStatus('fallback')
        }
      }
    }

    loadContributions()

    return () => {
      cancelled = true
    }
  }, [fallbackWeeks, username])

  const totalContributions = useMemo(
    () => weeks.flat().reduce((sum, cell) => sum + cell.count, 0),
    [weeks]
  )

  return (
    <div className="atlas-activity-stage">
      <div className="atlas-activity-grid" data-status={status}>
        {weeks.map((week, index) => (
          <div key={`week-${index}`} className="atlas-activity-week">
            {week.map((cell) => (
              <span
                key={cell.date}
                title={`${cell.date}: ${cell.count} contributions`}
                className="atlas-heat-cell"
                data-level={cell.intensity}
                aria-label={`${cell.date}: ${cell.count} contributions`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="atlas-activity-meta">
        <span>{status === 'ready' ? 'Live public contributions' : 'Fallback sample data'}</span>
        <span>{totalContributions} / 12 weeks</span>
      </div>
    </div>
  )
}
