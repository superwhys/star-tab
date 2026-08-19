import { describe, expect, it } from 'vitest'
import { MOCK_BOOKMARK_TREE } from '../data/mockBookmarks'
import {
  bookmarkHostname,
  bookmarkInitial,
  findBookmarkNode,
  findDefaultBookmarkFolder,
  flattenFolders,
  normalizeBookmarkTree,
} from './bookmarks'

describe('bookmark utilities', () => {
  it('normalizes Chrome bookmark nodes into app nodes', () => {
    const result = normalizeBookmarkTree([
      {
        id: '0',
        title: '',
        syncing: false,
        children: [
          {
            id: '1',
            parentId: '0',
            title: '书签栏',
            syncing: false,
            children: [
              { id: '10', parentId: '1', title: 'Vue', url: 'https://vuejs.org', syncing: false },
            ],
          },
        ],
      },
    ])

    expect(result[0]?.children[0]?.type).toBe('folder')
    expect(result[0]?.children[0]?.children[0]).toMatchObject({
      type: 'bookmark',
      title: 'Vue',
      url: 'https://vuejs.org',
    })
  })

  it('finds the bookmarks bar and nested folders', () => {
    expect(findDefaultBookmarkFolder(MOCK_BOOKMARK_TREE)?.id).toBe('1')
    expect(findBookmarkNode(MOCK_BOOKMARK_TREE, '116')?.title).toBe('代码仓库')

    const options = flattenFolders(MOCK_BOOKMARK_TREE)
    expect(options.find((folder) => folder.id === '116')).toMatchObject({ depth: 2 })
  })

  it('creates stable fallback labels', () => {
    expect(bookmarkInitial(' github')).toBe('G')
    expect(bookmarkInitial('知乎')).toBe('知')
    expect(bookmarkHostname('https://www.github.com/openai')).toBe('github.com')
    expect(bookmarkHostname('not a url')).toBe('')
  })
})
