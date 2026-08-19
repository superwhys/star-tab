import type { BookmarkNode, FolderOption } from '../types'

type ChromeBookmarkNode = chrome.bookmarks.BookmarkTreeNode & {
  folderType?: BookmarkNode['folderType']
}

export function normalizeBookmarkTree(nodes: ChromeBookmarkNode[]): BookmarkNode[] {
  return nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId,
    title: node.title || defaultFolderTitle(node.folderType),
    type: node.url ? 'bookmark' : 'folder',
    url: node.url,
    children: normalizeBookmarkTree((node.children ?? []) as ChromeBookmarkNode[]),
    folderType: node.folderType,
  }))
}

function defaultFolderTitle(folderType?: BookmarkNode['folderType']): string {
  if (folderType === 'bookmarks-bar') return '书签栏'
  if (folderType === 'other') return '其他书签'
  if (folderType === 'mobile') return '移动设备书签'
  return ''
}

export function findDefaultBookmarkFolder(nodes: BookmarkNode[]): BookmarkNode | undefined {
  const topLevel = nodes.length === 1 && nodes[0]?.id === '0' ? nodes[0].children : nodes
  return (
    topLevel.find((node) => node.folderType === 'bookmarks-bar') ??
    topLevel.find((node) => node.id === '1') ??
    topLevel.find((node) => /书签栏|bookmarks bar/i.test(node.title)) ??
    topLevel.find((node) => node.type === 'folder')
  )
}

export function findBookmarkNode(nodes: BookmarkNode[], id: string): BookmarkNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const match = findBookmarkNode(node.children, id)
    if (match) return match
  }
  return undefined
}

export function flattenFolders(nodes: BookmarkNode[]): FolderOption[] {
  const result: FolderOption[] = []
  const source = nodes.length === 1 && nodes[0]?.id === '0' ? nodes[0].children : nodes

  const visit = (items: BookmarkNode[], depth: number) => {
    items.forEach((node) => {
      if (node.type !== 'folder') return
      result.push({
        id: node.id,
        title: node.title || '未命名文件夹',
        depth,
        folderType: node.folderType,
      })
      visit(node.children, depth + 1)
    })
  }

  visit(source, 0)
  return result
}

export function searchBookmarks(nodes: BookmarkNode[], query: string, limit = 7): BookmarkNode[] {
  const normalizedQuery = normalizeSearchText(query)
  const terms = normalizedQuery.split(' ').filter(Boolean)
  if (terms.length === 0 || limit <= 0) return []

  const matches: Array<{ node: BookmarkNode; score: number; order: number }> = []
  let order = 0

  const visit = (items: BookmarkNode[]) => {
    items.forEach((node) => {
      if (node.type === 'bookmark' && node.url) {
        const title = normalizeSearchText(node.title)
        const hostname = normalizeSearchText(bookmarkHostname(node.url))
        const url = normalizeSearchText(node.url)
        const searchable = `${title} ${hostname} ${url}`

        if (terms.every((term) => searchable.includes(term))) {
          let score = 5
          if (title === normalizedQuery) score = 0
          else if (title.startsWith(normalizedQuery)) score = 1
          else if (title.includes(normalizedQuery)) score = 2
          else if (hostname.startsWith(normalizedQuery)) score = 3
          else if (hostname.includes(normalizedQuery)) score = 4
          matches.push({ node, score, order })
        }
        order += 1
      }
      if (node.children.length > 0) visit(node.children)
    })
  }

  visit(nodes)
  return matches
    .sort((left, right) => left.score - right.score || left.order - right.order)
    .slice(0, limit)
    .map(({ node }) => node)
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function bookmarkInitial(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return '·'
  const first = Array.from(trimmed)[0] ?? '·'
  return /[a-z]/i.test(first) ? first.toUpperCase() : first
}

export function bookmarkHostname(url?: string): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function bookmarkAccent(value: string): string {
  const accents = ['indigo', 'violet', 'cyan', 'rose', 'amber', 'emerald']
  const hash = Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0)
  return accents[hash % accents.length] ?? accents[0]
}
