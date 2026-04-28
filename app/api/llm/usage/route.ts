import { NextResponse } from 'next/server'

import { aggregateUsagePayload, buildEmptyUsageSnapshot, type UsageApiPayload } from 'app/utils/llm-usage'

const LLM_USAGE_ENDPOINT = 'https://simoncpa.cc.cd/v0/management/usage'

function buildFallbackUsageSnapshot() {
  return {
    ...buildEmptyUsageSnapshot(),
    status: 'fallback' as const,
  }
}

export async function GET() {
  const token = process.env.LLM_USAGE_BEARER_TOKEN

  if (!token) {
    return NextResponse.json(buildFallbackUsageSnapshot(), { status: 200 })
  }

  try {
    const response = await fetch(LLM_USAGE_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 900,
      },
    })

    if (!response.ok) {
      throw new Error(`Usage request failed with ${response.status}`)
    }

    const payload = (await response.json()) as UsageApiPayload
    const snapshot = aggregateUsagePayload(payload)

    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=900, stale-while-revalidate=3600',
      },
    })
  } catch {
    return NextResponse.json(buildFallbackUsageSnapshot(), {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    })
  }
}
