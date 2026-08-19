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

