export type CommitDayCell = {
  date: string
  count: number
  intensity: 0 | 1 | 2 | 3 | 4
}

export type ContributionDay = {
  date: string
  count: number
  level?: number
}

export const HEATMAP_DAYS = 84
export const HEATMAP_WEEKS = 12

function formatDayKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toIntensity(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || maxCount <= 0) {
    return 0
  }

  const scaled = Math.ceil((count / maxCount) * 4)
  return Math.min(4, Math.max(1, scaled)) as 0 | 1 | 2 | 3 | 4
}

export function parseGitHubUsername(profileUrl: string) {
  try {
    const url = new URL(profileUrl)
    const [username] = url.pathname.split('/').filter(Boolean)
    return username || null
  } catch {
    return null
  }
}

export function buildFallbackContributionDays() {
  const seeds = [0, 2, 5, 1, 0, 3, 4, 1, 0, 2, 6, 1]
  const now = new Date()
  const days: ContributionDay[] = []

  for (let i = HEATMAP_DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    day.setHours(0, 0, 0, 0)

    days.push({
      date: formatDayKey(day),
      count: seeds[i % seeds.length] > 4 ? 2 : seeds[i % seeds.length] > 1 ? 1 : 0,
    })
  }

  return days
}

export function buildCommitHeatmap(contributionDays: ContributionDay[]) {
  const counts = new Map<string, number>()

  contributionDays.forEach(({ date: value, count }) => {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return
    }

    date.setHours(0, 0, 0, 0)
    counts.set(formatDayKey(date), count)
  })

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const cells: CommitDayCell[] = []

  for (let i = HEATMAP_DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    const key = formatDayKey(day)
    const count = counts.get(key) || 0

    cells.push({
      date: key,
      count,
      intensity: 0,
    })
  }

  const maxCount = cells.reduce((max, cell) => Math.max(max, cell.count), 0)
  const normalized = cells.map((cell) => ({
    ...cell,
    intensity: toIntensity(cell.count, maxCount),
  }))

  return Array.from({ length: HEATMAP_WEEKS }, (_, weekIndex) =>
    normalized.slice(weekIndex * 7, weekIndex * 7 + 7)
  )
}
