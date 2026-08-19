import { describe, expect, it } from 'vitest'
import { MOCK_BOOKMARK_TREE } from '../data/mockBookmarks'
import type { BookmarkNode } from '../types'
import { findDefaultBookmarkFolder } from './bookmarks'
import { buildConstellationLayout, CONSTELLATION_VIEWBOX } from './constellation'

describe('constellation layout', () => {
  it('builds a stable connected layout for folders and bookmarks', () => {
    const section = findDefaultBookmarkFolder(MOCK_BOOKMARK_TREE)!
    const first = buildConstellationLayout([section])
    const second = buildConstellationLayout([section])

    expect(first).toEqual(second)
    expect(first.nodes[0]).toMatchObject({ kind: 'section', node: section, depth: 0 })
    expect(first.nodes.some((node) => node.kind === 'folder')).toBe(true)
    expect(first.nodes.some((node) => node.kind === 'bookmark')).toBe(true)
    expect(first.edges.length).toBeGreaterThan(0)
    expect(first.nodes.every((node) => node.x >= 0 && node.x <= CONSTELLATION_VIEWBOX.width)).toBe(true)
    expect(first.nodes.every((node) => node.y >= 0 && node.y <= CONSTELLATION_VIEWBOX.height)).toBe(true)
  })

  it('collapses oversized sections into a more node', () => {
    const section: BookmarkNode = {
      id: 'large',
      title: '大型分组',
      type: 'folder',
      children: Array.from({ length: 70 }, (_, index) => ({
        id: `page-${index}`,
        parentId: 'large',
        title: `Page ${index}`,
        type: 'bookmark' as const,
        url: `https://example.com/${index}`,
        children: [],
      })),
    }

    const layout = buildConstellationLayout([section])
    const moreNode = layout.nodes.find((node) => node.kind === 'more')

    expect(layout.nodes.length).toBeLessThanOrEqual(49)
    expect(moreNode?.hiddenCount).toBe(23)
    expect(moreNode?.node).toBe(section)
  })

  it('connects additional selected groups to the primary star', () => {
    const rootFolders = MOCK_BOOKMARK_TREE[0].children
    const layout = buildConstellationLayout(rootFolders.slice(0, 2))
    const sectionNodes = layout.nodes.filter((node) => node.kind === 'section')

    expect(sectionNodes).toHaveLength(2)
    expect(layout.edges.some((edge) => edge.from === sectionNodes[0].id && edge.to === sectionNodes[1].id)).toBe(true)
  })
})
