import Link from 'next/link'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: 'https://github.com/simon1uo', label: 'GitHub', external: true },
  { href: 'mailto:hello@example.com', label: 'Contact', external: true },
]

export function Navbar() {
  return (
    <header className="atlas-panel atlas-nav overflow-hidden">
      <div className="grid grid-cols-2 border-b border-[var(--atlas-border)] md:grid-cols-6">
        <div className="atlas-slot col-span-2 border-r border-[var(--atlas-border)] px-3 py-3 md:col-span-2">
          <p className="font-mono text-xl tracking-tight text-[var(--atlas-accent)]">
            SIMON LUO
          </p>
        </div>
        {navItems.map((item) => {
          const className =
            'atlas-slot border-r border-[var(--atlas-border)] px-3 py-3 text-xs uppercase tracking-[0.16em] text-[var(--atlas-muted)] transition hover:text-[var(--atlas-accent)]'

          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {item.label}
              </a>
            )
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
