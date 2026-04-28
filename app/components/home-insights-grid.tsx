import { siteConfig } from 'app/config/site'
import { GitHubActivityHeatmap } from 'app/components/github-activity-heatmap'
import { HomeLocationMapShell } from 'app/components/home-location-map-shell'
import {
  buildCommitHeatmap,
  buildFallbackContributionDays,
  parseGitHubUsername,
} from 'app/utils/heatmap'

type LlmUsagePoint = {
  label: string
  totalTokens: number
  model: string
}

type ModelShare = {
  model: string
  tokens: number
}

const llmUsagePoints: LlmUsagePoint[] = [
  { label: 'W1', totalTokens: 18200, model: 'gpt-4.1' },
  { label: 'W2', totalTokens: 24600, model: 'gpt-4.1' },
  { label: 'W3', totalTokens: 31900, model: 'gpt-4.1-mini' },
  { label: 'W4', totalTokens: 28200, model: 'gpt-5.2' },
  { label: 'W5', totalTokens: 35700, model: 'gpt-5.2' },
  { label: 'W6', totalTokens: 41200, model: 'gpt-5.5' },
  { label: 'W7', totalTokens: 46800, model: 'gpt-5.5' },
]

const llmModelShare: ModelShare[] = [
  { model: 'gpt-5.5', tokens: 124600 },
  { model: 'gpt-5.2', tokens: 86200 },
  { model: 'gpt-4.1', tokens: 61300 },
]

function formatTokenCount(value: number) {
  return `${Math.round(value / 1000)}k`
}

function chartPoints(values: number[], width: number, height: number, padding: number) {
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

export async function HomeInsightsGrid() {
  const commitWeeks = buildCommitHeatmap(buildFallbackContributionDays())
  const githubUsername = parseGitHubUsername(siteConfig.socialLinks.github)
  const totalTokens = llmUsagePoints.reduce((sum, point) => sum + point.totalTokens, 0)
  const latestTokens = llmUsagePoints[llmUsagePoints.length - 1].totalTokens
  const trendPoints = chartPoints(
    llmUsagePoints.map((point) => point.totalTokens),
    240,
    86,
    10
  )

  return (
    <section>
      <div className="atlas-grid-stack grid grid-cols-2 lg:grid-cols-4">
        <article className="atlas-insight-card atlas-insight-card-location">
          <div className="atlas-location-map-bg" aria-hidden="true">
            <HomeLocationMapShell />
          </div>

          <div className="atlas-location-copy">
            <p className="atlas-insight-embedded-label">Location</p>
            <p className="mt-2 font-mono text-sm uppercase tracking-[0.08em] text-[var(--atlas-text)]">
              {siteConfig.location}.
            </p>
            <p className="mt-2 text-xs text-[var(--atlas-muted)]">{siteConfig.homeInsights.locationMetaLine}</p>
          </div>
        </article>

        <article className="atlas-insight-card">
          <p className="atlas-insight-embedded-label">Photography</p>
          <p className="mt-2 font-mono text-sm uppercase tracking-[0.08em] text-[var(--atlas-text)]">
            Photo Stack Stand
          </p>
          <p className="mt-2 text-xs text-[var(--atlas-muted)]">Archive pending upload.</p>
          <div className="atlas-photo-stage mt-5">
            <span className="atlas-photo-frame atlas-photo-frame-1" />
            <span className="atlas-photo-frame atlas-photo-frame-2" />
            <span className="atlas-photo-frame atlas-photo-frame-3" />
            <span className="atlas-photo-tag">No photos yet</span>
          </div>
        </article>

        <article className="atlas-insight-card atlas-insight-card-activity">
          <GitHubActivityHeatmap username={githubUsername} fallbackWeeks={commitWeeks} />
          <div className="atlas-activity-copy">
            <p className="atlas-insight-embedded-label">Git Activity</p>
            <p className="mt-2 font-mono text-sm uppercase tracking-[0.08em] text-[var(--atlas-text)]">
              Commit Heatmap
            </p>
            <p className="mt-2 text-xs text-[var(--atlas-muted)]">Last 12 weeks of public GitHub contributions.</p>
          </div>
        </article>

        <article className="atlas-insight-card">
          <p className="atlas-insight-embedded-label">LLM Usage</p>
          <p className="mt-2 font-mono text-sm uppercase tracking-[0.08em] text-[var(--atlas-text)]">
            Models & Tokens
          </p>
          <p className="mt-2 text-xs text-[var(--atlas-muted)]">
            Latest {llmUsagePoints[llmUsagePoints.length - 1].model} {formatTokenCount(latestTokens)} • Total{' '}
            {formatTokenCount(totalTokens)}
          </p>

          <svg
            viewBox="0 0 240 86"
            className="mt-4 h-[86px] w-full border border-[color-mix(in_srgb,var(--atlas-border)_74%,transparent)] bg-[color-mix(in_srgb,var(--atlas-surface-strong)_72%,transparent)]"
            role="img"
            aria-label="LLM token trend chart"
          >
            <polyline
              fill="none"
              stroke="var(--atlas-accent)"
              strokeWidth="1.6"
              points={trendPoints}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="mt-4 space-y-2">
            {llmModelShare.map((item) => {
              const width = (item.tokens / llmModelShare[0].tokens) * 100

              return (
                <div key={item.model} className="space-y-1">
                  <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.1em] text-[var(--atlas-muted)]">
                    <span>{item.model}</span>
                    <span>{formatTokenCount(item.tokens)}</span>
                  </div>
                  <div className="h-1.5 border border-[color-mix(in_srgb,var(--atlas-border)_74%,transparent)] bg-transparent">
                    <div
                      className="h-full bg-[color-mix(in_srgb,var(--atlas-accent)_46%,transparent)]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </div>
    </section>
  )
}
