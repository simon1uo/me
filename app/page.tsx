import Link from 'next/link'
import { FeaturedProjects } from 'app/components/posts'
import { siteConfig } from 'app/config/site'

export default function Page() {
  return (
    <section className="space-y-6">
      <header className="atlas-panel grid gap-4 p-6 sm:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="atlas-label">Profile</p>
          <h1 className="mt-2 text-4xl font-semibold uppercase tracking-[0.06em] text-[var(--atlas-accent)] sm:text-5xl">
            {siteConfig.name}
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            {siteConfig.roleLine}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--atlas-text)]">
            {siteConfig.introEn}
          </p>
          <p className="mt-2 text-sm text-[var(--atlas-muted)]">
            {siteConfig.introCn}
          </p>
        </div>
        <div className="border border-[var(--atlas-border)] p-4 text-sm text-[var(--atlas-text)]">
          <p className="atlas-label">Meta</p>
          <p className="mt-3">Location: {siteConfig.location}</p>
          <p className="mt-2">Email: {siteConfig.email}</p>
          <div className="mt-3 flex gap-3 text-xs uppercase tracking-[0.12em]">
            <a
              href={siteConfig.socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--atlas-accent)]"
            >
              GitHub
            </a>
            <a
              href={siteConfig.socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--atlas-accent)]"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </header>

      <section className="atlas-panel p-6">
        <p className="atlas-label">Tech Stack</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {siteConfig.stackGroups.map((group) => (
            <article
              key={group.title}
              className="border border-[var(--atlas-border)] p-4"
            >
              <h2 className="text-xs uppercase tracking-[0.14em] text-[var(--atlas-accent)]">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-1 text-sm text-[var(--atlas-text)]">
                {group.items.map((item) => (
                  <li key={item}>[{item}]</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="atlas-panel p-6">
          <p className="atlas-label">Notes</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--atlas-text)]">
            {siteConfig.notesPanel.map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </article>
        <article className="atlas-panel p-6">
          <p className="atlas-label">Stack Snapshot</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--atlas-text)]">
            {siteConfig.stackSnapshot.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="atlas-panel p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="atlas-label">Selected Work</p>
          <Link
            href="/projects"
            className="text-xs uppercase tracking-[0.12em] text-[var(--atlas-muted)] hover:text-[var(--atlas-accent)]"
          >
            View Archive
          </Link>
        </div>
        <FeaturedProjects />
      </section>
    </section>
  )
}
