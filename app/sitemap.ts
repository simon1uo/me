import { getProjects } from 'app/projects/utils'
import { siteConfig } from 'app/config/site'

export const baseUrl = siteConfig.baseUrl

export default async function sitemap() {
  const projects = getProjects().map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: project.metadata.publishedAt,
  }))

  const routes = ['', '/projects'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...projects]
}
