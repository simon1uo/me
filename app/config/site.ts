type StackGroup = {
  title: string
  items: string[]
}

type SiteConfig = {
  name: string
  roleLine: string
  introEn: string
  introCn: string
  location: string
  email: string
  socialLinks: {
    github: string
    linkedin: string
    x: string
  }
  stackGroups: StackGroup[]
  notesPanel: string[]
  stackSnapshot: string[]
}

export const siteConfig: SiteConfig = {
  name: 'Simon Luo',
  roleLine: 'Research-Driven Software Engineer',
  introEn:
    'I build reliable product systems with a focus on tooling clarity, delivery discipline, and maintainable interfaces.',
  introCn: '专注于系统化工程实践、稳定交付与可维护的产品基础设施。',
  location: 'Shanghai, China',
  email: 'hello@example.com',
  socialLinks: {
    github: 'https://github.com/simon1uo',
    linkedin: 'https://www.linkedin.com',
    x: 'https://x.com',
  },
  stackGroups: [
    {
      title: 'Frontend Systems',
      items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    },
    {
      title: 'Backend / Infra',
      items: ['Node.js', 'PostgreSQL', 'OpenTelemetry', 'Docker'],
    },
    {
      title: 'Tooling / Workflow',
      items: ['GitHub Actions', 'ESLint', 'pnpm/npm', 'Vercel'],
    },
  ],
  notesPanel: [
    'Investigating lighter deployment workflows for small Next.js systems.',
    'Refining observability boundaries for product-facing services.',
    'Reducing UI noise while preserving technical context.',
  ],
  stackSnapshot: [
    'Next.js + TypeScript',
    'MDX-first content',
    'Edge-ready deployment',
  ],
}
