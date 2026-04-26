import './global.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Newsreader } from 'next/font/google'
import { Navbar } from './components/nav'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Footer from './components/footer'
import { baseUrl } from './sitemap'
import { siteConfig } from 'app/config/site'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  icons: {
    icon: [{ url: '/favicon-serif.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon-serif.svg'],
  },
  title: {
    default: siteConfig.seo.defaultTitle,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.description,
  openGraph: {
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.description,
    url: baseUrl,
    siteName: siteConfig.seo.siteName,
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const cx = (...classes) => classes.filter(Boolean).join(' ')

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
})

const preferenceScript = `
(() => {
  const themeKey = 'atlas-theme-preference'
  const fontKey = 'atlas-font-preference'
  const root = document.documentElement
  const setFavicon = (fontPreference) => {
    const href = fontPreference === 'sans' ? '/favicon-sans.svg' : '/favicon-serif.svg'
    const iconTargets = [
      { rel: 'icon', type: 'image/svg+xml' },
      { rel: 'shortcut icon' },
    ]

    iconTargets.forEach((target) => {
      let link = document.querySelector(
        \`link[rel="\${target.rel}"][data-atlas-favicon="true"]\`
      )
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', target.rel)
        link.setAttribute('data-atlas-favicon', 'true')
        document.head.appendChild(link)
      }

      if (target.type) {
        link.setAttribute('type', target.type)
      }
      link.setAttribute('href', href)
    })
  }
  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  try {
    const themePreference = window.localStorage.getItem(themeKey) || 'system'
    const fontPreference = window.localStorage.getItem(fontKey) || 'serif'
    root.dataset.themePreference = themePreference
    root.dataset.theme = themePreference === 'system' ? getSystemTheme() : themePreference
    root.dataset.font = fontPreference
    setFavicon(fontPreference)
  } catch (error) {
    root.dataset.themePreference = 'system'
    root.dataset.theme = getSystemTheme()
    root.dataset.font = 'serif'
    setFavicon('serif')
  }

  window.addEventListener('atlas-preferences-change', (event) => {
    const detail = event && typeof event === 'object' && 'detail' in event ? event.detail : null
    const fontPreference =
      detail && detail.fontPreference ? detail.fontPreference : root.dataset.font || 'serif'
    setFavicon(fontPreference)
  })
})()
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cx(
        'bg-[var(--atlas-bg)] text-[var(--atlas-text)]',
        GeistSans.variable,
        GeistMono.variable,
        newsreader.variable
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
      </head>
      <body className="antialiased">
        <div className="atlas-bg" aria-hidden="true" />
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-10">
          <div className="atlas-stack flex-auto">
            <Navbar />
            <div className="atlas-reveal flex-auto">{children}</div>
            <Footer />
          </div>
          <Analytics />
          <SpeedInsights />
        </main>
      </body>
    </html>
  )
}
