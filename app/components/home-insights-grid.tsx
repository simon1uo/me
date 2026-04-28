import { siteConfig } from 'app/config/site'
import { GitHubActivityHeatmap } from 'app/components/github-activity-heatmap'
import { HomeLocationMapShell } from 'app/components/home-location-map-shell'
import { LlmUsageCard } from 'app/components/llm-usage-card'
import {
  buildCommitHeatmap,
  buildFallbackContributionDays,
  parseGitHubUsername,
} from 'app/utils/heatmap'

export async function HomeInsightsGrid() {
  const commitWeeks = buildCommitHeatmap(buildFallbackContributionDays())
  const githubUsername = parseGitHubUsername(siteConfig.socialLinks.github)

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

        <LlmUsageCard />
      </div>
    </section>
  )
}
