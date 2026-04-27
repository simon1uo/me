import { siteConfig } from 'app/config/site'
import { GitHubActivityHeatmap } from 'app/components/github-activity-heatmap'
import {
  buildCommitHeatmap,
  buildFallbackContributionDays,
  parseGitHubUsername,
} from 'app/components/github-activity-heatmap-utils'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cache } from 'react'

type LlmUsagePoint = {
  label: string
  totalTokens: number
  model: string
}

type ModelShare = {
  model: string
  tokens: number
}

type GeoPoint = [number, number]

type GeoJsonGeometry =
  | {
      type: 'Polygon'
      coordinates: GeoPoint[][]
    }
  | {
      type: 'MultiPolygon'
      coordinates: GeoPoint[][][]
    }

type GeoJsonFeature = {
  properties?: {
    adcode?: number
    name?: string
  }
  geometry?: GeoJsonGeometry
}

type GeoJsonFeatureCollection = {
  features?: GeoJsonFeature[]
}

type ProvincePath = {
  adcode: number
  name: string
  d: string
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

function buildProjector(features: GeoJsonFeature[], width: number, height: number, padding: number) {
  if (!features.length) {
    return ([lon, lat]: GeoPoint) => [lon, lat] as const
  }

  let minLon = Number.POSITIVE_INFINITY
  let maxLon = Number.NEGATIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  const updateBounds = ([lon, lat]: GeoPoint) => {
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }

  features.forEach((feature) => {
    const geometry = feature.geometry

    if (!geometry) {
      return
    }

    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach((ring) => ring.forEach(updateBounds))
      return
    }

    geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => ring.forEach(updateBounds)))
  })

  const lonSpan = Math.max(0.000001, maxLon - minLon)
  const latSpan = Math.max(0.000001, maxLat - minLat)
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2
  const scale = Math.min(innerWidth / lonSpan, innerHeight / latSpan)
  const offsetX = (width - lonSpan * scale) / 2
  const offsetY = (height - latSpan * scale) / 2

  return ([lon, lat]: GeoPoint) => {
    const x = offsetX + (lon - minLon) * scale
    const y = offsetY + (maxLat - lat) * scale
    return [x, y] as const
  }
}

function geometryToPathData(geometry: GeoJsonGeometry, project: (point: GeoPoint) => readonly [number, number]) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const paths: string[] = []

  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      if (!ring.length) {
        return
      }

      const [firstX, firstY] = project(ring[0])
      let segment = `M ${firstX.toFixed(2)} ${firstY.toFixed(2)}`

      for (let index = 1; index < ring.length; index += 1) {
        const [x, y] = project(ring[index])
        segment += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
      }

      segment += ' Z'
      paths.push(segment)
    })
  })

  return paths.join(' ')
}

function featuresToPathData(
  features: GeoJsonFeature[],
  project: (point: GeoPoint) => readonly [number, number]
) {
  return features
    .filter((feature): feature is GeoJsonFeature & { geometry: GeoJsonGeometry } => Boolean(feature.geometry))
    .map((feature) => geometryToPathData(feature.geometry, project))
    .join(' ')
}

const loadGuangdongGeoPaths = cache(async () => {
  const chinaSource = await readFile(join(process.cwd(), 'public', 'maps', 'china-100000-full.json'), 'utf8')
  const guangdongSource = await readFile(join(process.cwd(), 'public', 'maps', 'china-440000.json'), 'utf8')
  const chinaPayload = JSON.parse(chinaSource) as GeoJsonFeatureCollection
  const guangdongPayload = JSON.parse(guangdongSource) as GeoJsonFeatureCollection
  const chinaFeatures = chinaPayload.features || []
  const guangdongFeatures = guangdongPayload.features || []
  // Focus projection on Guangdong to make the province visually dominant.
  const project = buildProjector(guangdongFeatures, 1200, 740, 10)
  const provinces: ProvincePath[] = chinaFeatures
    .filter(
      (feature): feature is GeoJsonFeature & { properties: { adcode: number; name: string }; geometry: GeoJsonGeometry } =>
        Boolean(feature.geometry && feature.properties?.adcode && feature.properties?.name)
    )
    .map((feature) => ({
      adcode: feature.properties.adcode,
      name: feature.properties.name,
      d: geometryToPathData(feature.geometry, project),
    }))
  const cityPaths = guangdongFeatures
    .filter((feature): feature is GeoJsonFeature & { geometry: GeoJsonGeometry } => Boolean(feature.geometry))
    .map((feature, index) => ({
      id: `gd-city-${index}`,
      name: feature.properties?.name || `City ${index + 1}`,
      d: geometryToPathData(feature.geometry, project),
    }))
  const guangdongPath = featuresToPathData(guangdongFeatures, project)

  return { provinces, guangdongPath, cityPaths }
})

export async function HomeInsightsGrid() {
  const guangdongMap = await loadGuangdongGeoPaths()
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
            <div className="atlas-location-geo-canvas">
              <svg
                viewBox="0 0 1200 740"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Map of China with Guangdong as focus"
              >
                <g className="atlas-location-geo-provinces">
                  {guangdongMap.provinces.map((province) => (
                    <path
                      key={province.adcode}
                      d={province.d}
                      data-adcode={province.adcode}
                      className="atlas-location-geo-province"
                    >
                      <title>{province.name}</title>
                    </path>
                  ))}
                </g>
                {guangdongMap.guangdongPath ? <path d={guangdongMap.guangdongPath} className="atlas-location-geo-guangdong" /> : null}
                <g className="atlas-location-geo-city-lines">
                  {guangdongMap.cityPaths.map((city) => (
                    <path key={city.id} d={city.d}>
                      <title>{city.name}</title>
                    </path>
                  ))}
                </g>
              </svg>
            </div>
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
