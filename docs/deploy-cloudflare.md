# Deploy to Cloudflare Workers (Next.js + OpenNext)

This repository deploys Next.js to Cloudflare Workers using OpenNext.

## 1) Cloudflare prerequisites

- Create/choose a Cloudflare account.
- Create an API Token with minimum Worker deploy permissions.
- Get your Cloudflare Account ID.

## 2) GitHub repository settings

Add the following in GitHub repo settings:

- `Variables`
  - `NEXT_PUBLIC_SITE_URL` (for example `https://me.example.com`)

`NEXT_PUBLIC_SITE_URL` is used for canonical URLs (sitemap/rss/OG metadata).

## 3) Deploy with Cloudflare "Import repository"

- In Cloudflare Dashboard, go to `Workers & Pages` -> `Create application` -> `Import repository`.
- Select this GitHub repository and configure:
  - Build command: `npm run cf:build`
  - Deploy command: `npm run cf:deploy`
- Set `NEXT_PUBLIC_SITE_URL` in Cloudflare build/runtime environment variables.

## 4) Workflows

- `.github/workflows/ci.yml`
  - Runs on `push` and `pull_request`
  - Executes `npm ci`, `npm run lint`, `npm run build`

## 5) Local deploy commands

```bash
npm run cf:build
npm run cf:deploy
```

Optional local Worker-like preview:

```bash
npm run cf:preview
```

## 6) Rollback

- In Cloudflare Dashboard, redeploy a previous successful deployment or redeploy an older commit from the connected repository history.
