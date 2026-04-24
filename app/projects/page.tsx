import { ProjectList } from 'app/components/posts'

export const metadata = {
  title: 'Projects',
  description: 'Selected engineering projects.',
}

export default function ProjectsPage() {
  return (
    <section className="atlas-stack">
      <header className="atlas-panel p-6">
        <p className="atlas-label">Project Archive</p>
        <h1 className="mt-2 text-3xl uppercase tracking-[0.08em] text-[var(--atlas-accent)]">
          Projects
        </h1>
        <p className="mt-3 text-sm text-[var(--atlas-muted)]">
          Selected engineering work with concise case summaries.
        </p>
      </header>
      <ProjectList />
    </section>
  )
}
