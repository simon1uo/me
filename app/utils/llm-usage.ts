export type UsageDetail = {
  timestamp?: string
  tokens?: {
    total_tokens?: number
  }
}

export type UsageModel = {
  total_requests?: number
  total_tokens?: number
  details?: UsageDetail[]
}

export type UsageApiBucket = {
  total_requests?: number
  total_tokens?: number
  models?: Record<string, UsageModel>
}

export type UsageApiPayload = {
  failed_requests?: number
  usage?: {
    total_requests?: number
    success_count?: number
    failure_count?: number
    total_tokens?: number
    apis?: Record<string, UsageApiBucket>
  }
}

export type UsageTimelinePoint = {
  hour: string
  totalTokens: number
}

export type UsageModelSummary = {
  model: string
  totalRequests: number
  totalTokens: number
  share: number
}

export type UsageSnapshot = {
  status: 'ready' | 'empty'
  window: '24h'
  totalRequests: number
  totalTokens: number
  successCount: number
  failedRequests: number
  models: UsageModelSummary[]
  timeline: UsageTimelinePoint[]
}

function startOfHour(date: Date) {
  const next = new Date(date)
  next.setMinutes(0, 0, 0)
  return next
}

function buildTimelineSeed(now: Date) {
  const end = startOfHour(now)

  return Array.from({ length: 24 }, (_, index) => {
    const bucket = new Date(end)
    bucket.setHours(end.getHours() - (23 - index))

    return {
      hour: bucket.toISOString(),
      totalTokens: 0,
    }
  })
}

export function buildEmptyUsageSnapshot(): UsageSnapshot {
  return {
    status: 'empty',
    window: '24h',
    totalRequests: 0,
    totalTokens: 0,
    successCount: 0,
    failedRequests: 0,
    models: [],
    timeline: [],
  }
}

export function aggregateUsagePayload(payload: UsageApiPayload, now = new Date()): UsageSnapshot {
  const usage = payload.usage

  if (!usage) {
    return buildEmptyUsageSnapshot()
  }

  const timeline = buildTimelineSeed(now)
  const timelineIndex = new Map(timeline.map((point, index) => [point.hour, index]))
  const models = new Map<string, UsageModelSummary>()
  const apis = usage.apis || {}

  for (const api of Object.values(apis)) {
    const apiModels = api.models || {}

    for (const [modelName, model] of Object.entries(apiModels)) {
      const current = models.get(modelName) || {
        model: modelName,
        totalRequests: 0,
        totalTokens: 0,
        share: 0,
      }

      current.totalRequests += model.total_requests || 0
      current.totalTokens += model.total_tokens || 0
      models.set(modelName, current)

      for (const detail of model.details || []) {
        if (!detail.timestamp) {
          continue
        }

        const detailDate = new Date(detail.timestamp)

        if (Number.isNaN(detailDate.getTime())) {
          continue
        }

        const key = startOfHour(detailDate).toISOString()
        const bucketIndex = timelineIndex.get(key)

        if (bucketIndex === undefined) {
          continue
        }

        timeline[bucketIndex].totalTokens += detail.tokens?.total_tokens || 0
      }
    }
  }

  const summaries = Array.from(models.values())
    .sort((left, right) => right.totalRequests - left.totalRequests)
    .map((entry) => ({
      ...entry,
      share: usage.total_requests ? entry.totalRequests / usage.total_requests : 0,
    }))

  return {
    status: summaries.length ? 'ready' : 'empty',
    window: '24h',
    totalRequests: usage.total_requests || 0,
    totalTokens: usage.total_tokens || 0,
    successCount: usage.success_count || 0,
    failedRequests: usage.failure_count || payload.failed_requests || 0,
    models: summaries,
    timeline,
  }
}
