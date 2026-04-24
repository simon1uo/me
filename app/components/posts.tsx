import Link from 'next/link'
import { formatDate, getProjects } from 'app/projects/utils'

function ProjectArchiveRow({
  project,
}: {
  project: ReturnType<typeof getProjects>[number]
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="atlas-archive-row block border border-[var(--atlas-border)] p-4 transition hover:border-[color:rgba(36,99,255,0.5)] hover:bg-[var(--atlas-surface-strong)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm uppercase tracking-[0.08em] text-[var(--atlas-accent)]">
          {project.metadata.title}
        </p>
        <p className="text-xs tabular-nums text-[var(--atlas-muted)]">
          {formatDate(project.metadata.publishedAt, false)}
        </p>
      </div>
      <p className="mt-2 text-sm text-[var(--atlas-text)]">
        {project.metadata.summary}
      </p>
      {project.metadata.tags ? (
        <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
          {project.metadata.tags}
        </p>
      ) : null}
    </Link>
  )
}

export function ProjectList() {
  const projects = getProjects()

  return (
    <div className="atlas-stack">
      {projects.map((project) => (
        <ProjectArchiveRow key={project.slug} project={project} />
      ))}
    </div>
  )
}

export function FeaturedProjects() {
  const projects = getProjects().filter(
    (project) => project.metadata.featured === 'true'
  )

  if (projects.length === 0) {
    return (
      <p className="text-sm text-[var(--atlas-muted)]">
        No featured projects yet. Add one in `content/projects`.
      </p>
    )
  }

  return (
    <div className="atlas-stack">
      {projects.map((project) => (
        <ProjectArchiveRow key={project.slug} project={project} />
      ))}
    </div>
  )
}
