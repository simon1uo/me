import fs from 'fs'
import path from 'path'

export type ProjectMetadata = {
  title: string
  publishedAt: string
  summary: string
  featured?: string
  tags?: string
  link?: string
}

export type Project = {
  metadata: ProjectMetadata
  slug: string
  content: string
}

const projectsDirectory = path.join(process.cwd(), 'content', 'projects')

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/
  const match = frontmatterRegex.exec(fileContent)

  if (!match) {
    throw new Error('Missing frontmatter block in project content file.')
  }

  const frontMatterBlock = match[1]
  const content = fileContent.replace(frontmatterRegex, '').trim()
  const frontMatterLines = frontMatterBlock.trim().split('\n')
  const metadata: Partial<ProjectMetadata> = {}

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(': ')
    const rawValue = valueArr.join(': ').trim()
    const value = rawValue.replace(/^['"](.*)['"]$/, '$1')
    metadata[key.trim() as keyof ProjectMetadata] = value
  })

  validateMetadata(metadata)

  return { metadata: metadata as ProjectMetadata, content }
}

function validateMetadata(metadata: Partial<ProjectMetadata>) {
  const required = ['title', 'publishedAt', 'summary'] as const

  required.forEach((key) => {
    if (!metadata[key]) {
      throw new Error(`Project frontmatter is missing required field: ${key}`)
    }
  })
}

function getMDXFiles(dir: string) {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

function getMDXData(dir: string): Project[] {
  const mdxFiles = getMDXFiles(dir)

  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file))
    const slug = path.basename(file, path.extname(file))

    return {
      metadata,
      slug,
      content,
    }
  })
}

export function getProjects() {
  return getMDXData(projectsDirectory).sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1
    }
    return 1
  })
}

export function getFeaturedProjects() {
  return getProjects().filter((project) => project.metadata.featured === 'true')
}

export function formatDate(date: string, includeRelative = false) {
  const currentDate = new Date()
  if (!date.includes('T')) {
    date = `${date}T00:00:00`
  }
  const targetDate = new Date(date)

  const yearsAgo = currentDate.getFullYear() - targetDate.getFullYear()
  const monthsAgo = currentDate.getMonth() - targetDate.getMonth()
  const daysAgo = currentDate.getDate() - targetDate.getDate()

  let formattedDate = ''

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`
  } else {
    formattedDate = 'Today'
  }

  const fullDate = targetDate.toLocaleString('en-us', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeRelative) {
    return fullDate
  }

  return `${fullDate} (${formattedDate})`
}

