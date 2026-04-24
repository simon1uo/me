# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js (App Router) portfolio foundation.

- `app/page.tsx`: minimal homepage
- `app/projects/page.tsx`: project list
- `app/projects/[slug]/page.tsx`: project detail
- `app/projects/utils.ts`: project content loader and frontmatter parser
- `app/config/site.ts`: personal profile config
- `content/projects/*.mdx`: local project content files

Keep feature logic close to its route. Prefer adding route-specific helpers under the same route folder unless reused globally.

## Build, Test, and Development Commands
- `npm run dev`: start local dev server.
- `npm run lint`: run ESLint checks.
- `npm run build`: production build (includes type checks in Next build).
- `npm run start`: run the built app.

Typical workflow:
1. `npm run lint`
2. `npm run build` 

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Indentation: 2 spaces, semicolon-free style (follow existing files).
- Components/files: use descriptive names (`ProjectPage`, `siteConfig`, `utils.ts`).
- Routes: follow Next.js conventions (`page.tsx`, `route.ts`, dynamic `[slug]`).
- Styling: Tailwind utility classes in JSX; keep classes readable and grouped by layout -> spacing -> color.
- Linting: `eslint` with `eslint-config-next` (`eslint.config.mjs`).

## Testing Guidelines
No dedicated unit/integration test framework is configured yet. Current quality gate is:
- `npm run lint`
- `npm run build`

When adding tests, prefer co-located `*.test.ts(x)` files and document new test commands in `package.json` and this guide.

## Commit & Pull Request Guidelines
Use concise Conventional Commit style where possible, as seen in history:
- `chore: initialize nextjs portfolio foundation`

Recommended prefixes: `feat`, `fix`, `chore`, `refactor`, `docs`.

PRs should include:
- What changed and why.
- Affected routes/files (for example `app/projects/[slug]/page.tsx`).
- Verification evidence (`npm run lint`, `npm run build`).
- Screenshots for UI-visible changes.

## Security & Configuration Tips
Do not commit secrets. Keep `.env` local only. Update `app/sitemap.ts` `baseUrl` before production deploy.
