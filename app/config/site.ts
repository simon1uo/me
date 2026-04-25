type StackGroup = {
  title: string
  items: string[]
}

type ContactEmails = {
  primary: string
  secondary?: string
}

type SiteConfig = {
  name: string
  roleLine: string
  introEn: string
  introCn: string
  location: string
  baseUrl: string
  emails: ContactEmails
  socialLinks: {
    github: string
    x: string
    instagram: string
  }
  stackGroups: StackGroup[]
  notesPanel: string[]
  stackSnapshot: string[]
  seo: {
    defaultTitle: string
    titleTemplate: string
    description: string
    siteName: string
    rssDescription: string
  }
}

export const siteConfig: SiteConfig = {
  name: 'Simon Luo',
  roleLine: 'Full-stack Developer / AI Agent Explorer',
  introEn: 'still keeping hungry and foolish',
  introCn: '持续求知若愚',
  location: 'Guangdong, China',
  baseUrl: 'https://simon1uo.github.io',
  emails: {
    primary: 'simon1uo.w@gmail.com',
    secondary: 'simon1uo@163.com',
  },
  socialLinks: {
    github: 'https://github.com/simon1uo',
    x: 'https://x.com/simon1uo',
    instagram: 'https://instagram.com/simon1uo',
  },
  stackGroups: [
    {
      title: 'Frontend Systems',
      items: ['Vue', 'React', 'TypeScript'],
    },
    {
      title: 'Backend / Infra',
      items: ['Node.js', 'Java', 'Spring Boot'],
    },
    {
      title: 'Tooling / Workflow',
      items: ['Vite', 'VueUse', 'Tailwind CSS'],
    },
  ],
  notesPanel: [
    'Building production-ready full-stack apps with React/Vue and TypeScript.',
    'Exploring AI agent workflows to improve engineering productivity.',
    'Focusing on maintainable architecture and fast delivery loops.',
  ],
  stackSnapshot: [
    'Vue + React + TypeScript',
    'Node.js / Java with Spring Boot',
    'Vite + Tailwind CSS + AI Agent Tooling',
  ],
  seo: {
    defaultTitle: 'Simon Luo | Portfolio',
    titleTemplate: '%s | Simon Luo',
    description: 'Full-stack developer portfolio focused on modern web systems and AI agent exploration.',
    siteName: 'Simon Luo Portfolio',
    rssDescription: 'Project updates from Simon Luo',
  },
}
