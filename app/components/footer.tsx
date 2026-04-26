import { siteConfig } from 'app/config/site'

export default function Footer() {
  const mitLicenseHref = `${siteConfig.socialLinks.github}/simon1uo/blob/main/LICENSE`
  const socialItems = [
    { label: 'GitHub', href: siteConfig.socialLinks.github },
    { label: 'X', href: siteConfig.socialLinks.x },
    { label: 'Instagram', href: siteConfig.socialLinks.instagram },
  ]

  return (
    <footer className="atlas-footer-index atlas-panel px-4 py-4 text-xs text-[var(--atlas-muted)] sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="uppercase tracking-[0.14em]">{siteConfig.name}</p>
        <div className="flex flex-wrap gap-4">
          {socialItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--atlas-accent)]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <p className="mt-3">
        © {new Date().getFullYear()} code is licensed under{' '}
        <a
          href={mitLicenseHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--atlas-accent)]"
        >
          MIT
        </a>
        ,<br />
        words and images are licensed under{' '}
        <a
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--atlas-accent)]"
        >
          CC BY-NC-SA 4.0
        </a>
      </p>
    </footer>
  )
}
