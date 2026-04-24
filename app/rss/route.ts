import { baseUrl } from 'app/sitemap'
import { getProjects } from 'app/projects/utils'

export async function GET() {
  const allProjects = await getProjects()

  const itemsXml = allProjects
    .map(
      (project) =>
        `<item>
          <title>${project.metadata.title}</title>
          <link>${baseUrl}/projects/${project.slug}</link>
          <description>${project.metadata.summary || ''}</description>
          <pubDate>${new Date(
            project.metadata.publishedAt
          ).toUTCString()}</pubDate>
        </item>`
    )
    .join('\n')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
        <title>Simon Luo Portfolio</title>
        <link>${baseUrl}</link>
        <description>Project updates from Simon Luo</description>
        ${itemsXml}
    </channel>
  </rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}
