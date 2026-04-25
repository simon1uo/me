import { baseUrl } from 'app/sitemap'
import { siteConfig } from 'app/config/site'
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
        <title>${siteConfig.seo.siteName}</title>
        <link>${baseUrl}</link>
        <description>${siteConfig.seo.rssDescription}</description>
        ${itemsXml}
    </channel>
  </rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}
