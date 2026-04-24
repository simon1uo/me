import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CustomMDX } from 'app/components/mdx'
import { formatDate, getProjects } from 'app/projects/utils'
import { baseUrl } from 'app/sitemap'

export async function generateStaticParams() {
  const projects = getProjects()

  return projects.map((project) => ({
    slug: project.slug,
  }))
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata | undefined> {
  const { slug } = await params
  const project = getProjects().find((post) => post.slug === slug)

  if (!project) {
    return
  }

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
  } = project.metadata
  const ogImage = `${baseUrl}/og?title=${encodeURIComponent(title)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/projects/${project.slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params
  const project = getProjects().find((post) => post.slug === slug)

  if (!project) {
    notFound()
  }

  const tags = project.metadata.tags
    ? project.metadata.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : []

  return (
    <section className="atlas-stack">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            headline: project.metadata.title,
            datePublished: project.metadata.publishedAt,
            dateModified: project.metadata.publishedAt,
            description: project.metadata.summary,
            image: `/og?title=${encodeURIComponent(project.metadata.title)}`,
            url: `${baseUrl}/projects/${project.slug}`,
            author: {
              '@type': 'Person',
              name: 'Simon Luo',
            },
          }),
        }}
      />
      <header className="atlas-panel p-6">
        <p className="atlas-label">Case File</p>
        <h1 className="title mt-2 text-3xl uppercase tracking-[0.06em] text-[var(--atlas-accent)]">
          {project.metadata.title}
        </h1>
        <div className="mt-4 grid gap-2 text-xs uppercase tracking-[0.12em] text-[var(--atlas-muted)] sm:grid-cols-3">
          <p>Published: {formatDate(project.metadata.publishedAt, false)}</p>
          <p>Slug: {project.slug}</p>
          <p>Tags: {tags.length ? tags.join(' / ') : 'N/A'}</p>
        </div>
      </header>
      <article className="prose atlas-prose atlas-panel p-6">
        <CustomMDX source={project.content} />
      </article>
    </section>
  )
}
