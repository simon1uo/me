import Link from 'next/link'
import { HomeLabTerminal } from 'app/components/home-lab-terminal'
import { FeaturedProjects } from 'app/components/posts'
import { siteConfig } from 'app/config/site'

export default function Page() {
  return (
    <section className="atlas-stack">
      <HomeLabTerminal
        name={siteConfig.name}
        roleLine={siteConfig.roleLine}
        location={siteConfig.location}
        email={siteConfig.email}
        stackGroups={siteConfig.stackGroups}
        notes={siteConfig.notesPanel}
        stackSnapshot={siteConfig.stackSnapshot}
      />

      <section className="atlas-panel p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="atlas-label">Selected Work</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--atlas-muted)]">
              Project pages remain the archive surface beneath the live terminal
              intro, giving the homepage a strong first-screen identity without
              losing direct access to work.
            </p>
          </div>
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
