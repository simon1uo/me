# LLM Usage Card Design

## Goal

Replace the mock `llm-usage` content in `app/components/home-insights-grid.tsx` with real 24-hour usage data from `https://simoncpa.cc.cd/v0/management/usage`, authenticated with a bearer token loaded from local environment variables. Present the data inside the existing homepage insight card as a single compact visualization showing total requests, total tokens, and model-level breakdown.

## Scope

In scope:

- Add a local server-side proxy route for LLM usage data
- Reuse the existing environment-variable pattern already used by the GitHub contributions API route
- Aggregate the external payload into a small card-specific response shape
- Redesign the `LLM Usage` card to display live 24-hour data in one card
- Handle unavailable and empty states without fake business metrics

Out of scope:

- Per-source or per-API-key breakdown
- Full request detail rendering
- New standalone dashboard pages
- Changes to unrelated homepage cards

## Current State

`app/components/home-insights-grid.tsx` currently renders the `LLM Usage` card from hard-coded arrays:

- `llmUsagePoints`
- `llmModelShare`

Those arrays drive:

- Summary copy
- A small SVG line chart
- Model share progress bars

The GitHub activity card already uses a safer pattern:

- browser requests a local route
- local route reads secret token from environment variables
- local route fetches upstream data server-side

That pattern should be mirrored for LLM usage.

## Data Source

Upstream endpoint:

- `https://simoncpa.cc.cd/v0/management/usage`

Authentication:

- bearer token sent server-side only

Observed payload shape from `demo.json`:

- `usage.total_requests`
- `usage.success_count`
- `usage.failure_count`
- `usage.total_tokens`
- `usage.apis.*.models.*.total_requests`
- `usage.apis.*.models.*.total_tokens`
- `usage.apis.*.models.*.details[]`

The `details` list includes timestamps and token counts for individual usage events. Those timestamps will be used to derive a 24-hour trend line for the card.

## Proposed Architecture

### 1. Local API route

Add a new route:

- `app/api/llm/usage/route.ts`

Responsibilities:

- read bearer token from environment variable
- fetch upstream usage data from `https://simoncpa.cc.cd/v0/management/usage`
- normalize and aggregate the payload into a card-specific response
- return a small JSON shape designed for the homepage card
- apply cache headers and `next.revalidate` similar to the GitHub route

This keeps the bearer token off the client and avoids coupling the homepage component directly to the upstream payload shape.

### 2. Aggregation layer inside the route

The route should flatten all `usage.apis.*.models.*` entries into one aggregated model map keyed by model name.

For each model:

- sum `total_requests`
- sum `total_tokens`
- collect request-level timestamps from `details`
- sum per-hour token volume for the last 24 hours

The route should then produce:

- card totals
- top models sorted by request count descending
- a 24-point hourly trend array for chart rendering

### 3. Frontend card consumption

`app/components/home-insights-grid.tsx` should stop using mock arrays and instead consume data from the local route.

Preferred rendering model:

- keep `HomeInsightsGrid` as the parent layout component
- move the LLM usage UI into a focused child component if needed for clarity
- request `/api/llm/usage` from the browser, similar to the GitHub heatmap card

This keeps the homepage server component simple and makes transient fetch failures easier to handle with component-level loading and fallback states.

## API Response Shape

The local route should return a compact response like:

```json
{
  "status": "ready",
  "window": "24h",
  "totalRequests": 1797,
  "totalTokens": 192437436,
  "successCount": 1775,
  "failedRequests": 22,
  "models": [
    {
      "model": "gpt-5.3-codex",
      "totalRequests": 1071,
      "totalTokens": 122334776,
      "share": 0.596
    }
  ],
  "timeline": [
    { "hour": "2026-04-27T14:00:00+08:00", "totalTokens": 12345 }
  ]
}
```

Notes:

- `share` should be based on `totalRequests / totalRequestsAllModels`
- `timeline` should contain exactly 24 buckets when possible
- the response should not expose raw `details`, `source`, `auth_index`, or API-key identifiers

## Card Design

The card will keep the current homepage visual language and adopt the approved hierarchy from visual option `A. Recommended`.

### Information hierarchy

1. Label and title
2. Two primary KPIs
3. Thin trend strip
4. Top 3 model rows

### Header

- label: `LLM Usage`
- title: `Requests • Tokens • Models`
- secondary line:
  - ready: `Live last 24h usage`
  - ready with failures: `Live last 24h usage • 22 failed`
  - fallback: `Usage unavailable`
  - empty: `No model activity in the last 24 hours`

### KPI block

Show two large values side-by-side:

- `totalRequests`
- `totalTokens`

Formatting:

- requests use locale separators, for example `1,797`
- tokens use compact notation, for example `192.4M`

### Trend strip

Render a thin 24-hour token trend using the aggregated hourly timeline.

Intent:

- communicate recency and live activity
- avoid turning the card into a dense dashboard

This chart is secondary to the KPI block and should stay visually restrained.

### Model ranking

Render up to 3 rows.

Each row includes:

- model name
- request count
- token count
- a horizontal bar using request share

Ordering:

- descending by `totalRequests`

Reasoning:

- the user asked for model statistics
- request share is easier to scan quickly than token share
- token counts still remain visible in row copy

## State Handling

### Ready

When the local route succeeds and model data exists:

- show live values
- show trend strip
- show top model rows

### Empty

When the route succeeds but model aggregation is empty:

- still show total requests and total tokens if available
- replace model section with short empty-state text
- keep card layout stable

### Fallback

When the route fails, token is missing, or upstream data is invalid:

- do not render fake usage metrics
- render neutral placeholders such as em dash values
- keep the card frame and title intact
- use clear status copy: `Usage unavailable`

This differs intentionally from the GitHub heatmap fallback strategy. Fake GitHub sample cells preserve shape; fake usage totals would misrepresent personal metrics.

## Caching and Revalidation

The local route should apply lightweight caching similar to the GitHub route.

Suggested behavior:

- `next.revalidate` on the upstream fetch
- cache headers on the response

Exact TTL can be short because the source window is only 24 hours. A moderate cache duration is acceptable to reduce repeated upstream requests while preserving near-live behavior.

## Environment Variables

Add a dedicated environment variable for the upstream bearer token.

Requirements:

- read it server-side only
- do not expose it through `NEXT_PUBLIC_*`
- mirror the lookup style already used for GitHub secrets

The specific variable name can be chosen during implementation, but it should be explicit and usage-specific.

## Verification Plan

Before considering the implementation complete:

- run `npm run lint`
- run `npm run build`
- load the homepage and confirm the card layout on desktop
- load the homepage and confirm the card layout on mobile
- confirm `/api/llm/usage` returns the reduced payload rather than raw upstream details

## Risks and Mitigations

### Risk: upstream payload shape drifts

Mitigation:

- validate nested fields defensively
- default to fallback or empty state instead of throwing in the UI

### Risk: raw payload is large

Mitigation:

- aggregate in the route
- only return the reduced card payload

### Risk: missing trend data for some hours

Mitigation:

- prebuild 24 hourly buckets
- fill missing buckets with zero

### Risk: homepage card becomes too dense

Mitigation:

- keep only two KPIs
- limit model rows to top 3
- keep failure count in secondary copy, not as a third primary metric
