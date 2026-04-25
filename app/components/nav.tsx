'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  useThemePreferences,
  type FontPreference,
  type ThemePreference,
} from './theme-preferences'

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/projects', label: 'Projects', icon: GridIcon },
  {
    href: 'https://github.com/simon1uo',
    label: 'GitHub',
    external: true,
    icon: BranchIcon,
  },
]

const themeOptions: Array<{
  value: ThemePreference
  label: string
  description: string
  icon: typeof SunIcon
}> = [
  {
    value: 'light',
    label: 'Light',
    description: 'Atlas daylight',
    icon: SunIcon,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Night dossier',
    icon: MoonIcon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Sync with OS',
    icon: MonitorIcon,
  },
]

const fontOptions: Array<{
  value: FontPreference
  label: string
  description: string
  sample: string
}> = [
  {
    value: 'serif',
    label: 'Serif',
    description: 'Editorial tone',
    sample: 'Aa',
  },
  {
    value: 'sans',
    label: 'Sans',
    description: 'Neutral technical',
    sample: 'Ae',
  },
]

function slotClass(index: number, total: number) {
  return [
    'atlas-slot px-3 py-3 transition',
    index % 2 === 0 ? 'border-r border-[var(--atlas-border)]' : '',
    index >= 2 ? 'border-t border-[var(--atlas-border)]' : '',
    index < total - 1 ? 'md:border-r md:border-[var(--atlas-border)]' : '',
    'md:border-t-0',
  ]
    .filter(Boolean)
    .join(' ')
}

const navTextClass =
  'block text-[0.68rem] leading-[1] uppercase tracking-[0.16em]'

const navInteractiveClass =
  'flex h-full w-full items-start pr-9 text-left text-[var(--atlas-muted)] transition hover:text-[var(--atlas-accent)]'

function NavSlot({
  className,
  icon,
  slotRef,
  children,
}: {
  className: string
  icon?: ReactNode
  slotRef?: React.RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  return (
    <div ref={slotRef} className={`${className} relative`}>
      {children}
      <span className="pointer-events-none absolute right-3 top-3 flex w-4 items-start justify-center text-[var(--atlas-accent)]">
        {icon}
      </span>
    </div>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    themePreference,
    fontPreference,
    resolvedTheme,
    ready,
    setThemePreference,
    setFontPreference,
  } = useThemePreferences()

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <header className="atlas-panel atlas-nav sticky top-6 z-40 overflow-visible">
      <div className="grid grid-cols-2 md:grid-cols-6">
        <div className="atlas-slot col-span-2 border-b border-[var(--atlas-border)] px-3 py-3 md:col-span-2 md:border-r md:border-b-0">
          <p className="font-mono text-xl tracking-tight text-[var(--atlas-accent)]">
            SIMON LUO
          </p>
        </div>
        {navItems.map((item, index) => {
          const className = slotClass(index, navItems.length + 1)
          const ItemIcon = item.icon
          if (item.external) {
            return (
              <NavSlot
                key={item.label}
                className={className}
                icon={<ItemIcon />}
              >
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navInteractiveClass}
                >
                  <span className={navTextClass}>{item.label}</span>
                </a>
              </NavSlot>
            )
          }

          return (
            <NavSlot key={item.label} className={className} icon={<ItemIcon />}>
              <Link href={item.href} className={navInteractiveClass}>
                <span className={navTextClass}>{item.label}</span>
              </Link>
            </NavSlot>
          )
        })}
        <NavSlot
          className={slotClass(navItems.length, navItems.length + 1)}
          icon={<ThemeStatusIcon theme={ready ? resolvedTheme : 'light'} />}
          slotRef={menuRef}
        >
          <div className="h-full">
            <button
              type="button"
              className={`${navInteractiveClass} cursor-pointer`}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="theme-panel"
              onClick={() => setOpen((current) => !current)}
            >
              <span className={navTextClass}>Theme</span>
            </button>
          </div>
          {open ? (
            <div
              id="theme-panel"
              className="atlas-menu atlas-panel absolute left-0 right-0 top-[calc(100%+1px)] z-30 w-full min-w-0 overflow-hidden"
            >
              <section>
                <div className="border-b border-[var(--atlas-border)] px-3 py-2">
                  <p className="atlas-label">Color Theme</p>
                </div>
                <div className="atlas-grid-stack grid grid-cols-3">
                  {themeOptions.map((option) => {
                    const Icon = option.icon

                    return (
                      <button
                        key={option.value}
                        type="button"
                        data-active={themePreference === option.value}
                        className="atlas-option"
                        aria-label={option.label}
                        title={option.label}
                        onClick={() => setThemePreference(option.value)}
                      >
                        <span className="flex items-center justify-center text-[var(--atlas-text)]">
                          <Icon />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
              <section className="border-t border-[var(--atlas-border)]">
                <div className="border-b border-[var(--atlas-border)] px-3 py-2">
                  <p className="atlas-label">Typography</p>
                </div>
                <div className="atlas-grid-stack grid grid-cols-2">
                  {fontOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      data-active={fontPreference === option.value}
                      className="atlas-option"
                      onClick={() => setFontPreference(option.value)}
                    >
                      <span className="flex items-center justify-between gap-2 text-[var(--atlas-text)]">
                        <span>{option.label}</span>
                        <span
                          className="text-base normal-case tracking-normal"
                          style={{
                            fontFamily:
                              option.value === 'serif'
                                ? 'var(--font-newsreader), Georgia, serif'
                                : 'var(--font-geist-sans), system-ui, sans-serif',
                          }}
                        >
                          {option.sample}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </NavSlot>
      </div>
    </header>
  )
}

function ThemeStatusIcon({ theme }: { theme: 'light' | 'dark' }) {
  if (theme === 'dark') {
    return <MoonIcon />
  }

  return <SunIcon />
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 1.75v2.1M10 16.15v2.1M18.25 10h-2.1M3.85 10h-2.1M15.84 4.16l-1.49 1.49M5.65 14.35l-1.49 1.49M15.84 15.84l-1.49-1.49M5.65 5.65 4.16 4.16" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M13.9 2.4a6.9 6.9 0 1 0 3.7 12.6A7.8 7.8 0 0 1 13.9 2.4Z" />
    </svg>
  )
}

function MonitorIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2.5" y="3" width="15" height="10.5" rx="1.5" />
      <path d="M7.5 17h5M10 13.5V17" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3.5 8.5 10 3.25l6.5 5.25" />
      <path d="M5.5 7.75v8h9v-8" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3.25" y="3.25" width="5.5" height="5.5" />
      <rect x="11.25" y="3.25" width="5.5" height="5.5" />
      <rect x="3.25" y="11.25" width="5.5" height="5.5" />
      <rect x="11.25" y="11.25" width="5.5" height="5.5" />
    </svg>
  )
}

function BranchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="4.5" r="1.75" />
      <circle cx="14" cy="6.5" r="1.75" />
      <circle cx="6" cy="15.5" r="1.75" />
      <path d="M7.75 4.75h2.5a3.75 3.75 0 0 1 3.75 3.75v0" />
      <path d="M6 6.25v7.5" />
    </svg>
  )
}
