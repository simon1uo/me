# Minimal Portfolio Base (Next.js + MDX)

This project is initialized from Vercel's `portfolio-starter-kit` baseline and adapted into a minimal professional personal portfolio.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Local MDX content for projects
- SEO baseline: `sitemap`, `robots`, RSS, dynamic OG image

## Key Structure

- `app/page.tsx`: minimal homepage
- `app/projects/page.tsx`: project list
- `app/projects/[slug]/page.tsx`: project detail
- `app/projects/utils.ts`: project content loader and frontmatter parser
- `app/config/site.ts`: personal profile config
- `content/projects/*.mdx`: local project content files

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run build
```

