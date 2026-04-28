import { NextResponse } from 'next/server'

import { HEATMAP_DAYS, type ContributionDay } from 'app/utils/heatmap'

type ContributionCalendarDay = {
  date: string
  contributionCount: number
}

type GitHubGraphQLPayload = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks?: Array<{
            contributionDays?: ContributionCalendarDay[]
          }>
        }
      }
    }
  }
}

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql'

function buildDateRange(days: number) {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = new Date(to)
  from.setDate(to.getDate() - (days - 1))
  from.setHours(0, 0, 0, 0)

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

const CONTRIBUTIONS_QUERY = `
  query UserContributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`

export async function GET(request: Request) {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    return NextResponse.json({ contributions: [] }, { status: 200 })
  }

  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username') || process.env.GITHUB_USERNAME

  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 })
  }

  const { from, to } = buildDateRange(HEATMAP_DAYS)

  try {
    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'nextjs-github-activity-heatmap',
      },
      body: JSON.stringify({
        query: CONTRIBUTIONS_QUERY,
        variables: {
          login: username,
          from,
          to,
        },
      }),
      next: {
        revalidate: 3600,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ contributions: [] }, { status: 200 })
    }

    const payload = (await response.json()) as GitHubGraphQLPayload
    const weeks = payload.data?.user?.contributionsCollection?.contributionCalendar?.weeks || []
    const contributions: ContributionDay[] = weeks
      .flatMap((week) => week.contributionDays || [])
      .map((day) => ({
        date: day.date,
        count: day.contributionCount,
      }))
      .slice(-HEATMAP_DAYS)

    return NextResponse.json(
      { contributions },
      {
        status: 200,
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch {
    return NextResponse.json({ contributions: [] }, { status: 200 })
  }
}
