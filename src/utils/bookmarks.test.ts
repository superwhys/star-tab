import { describe, expect, it } from 'vitest'
import { MOCK_BOOKMARK_TREE } from '../data/mockBookmarks'
import {
  bookmarkHostname,
  bookmarkInitial,
  findBookmarkNode,
  findDefaultBookmarkFolder,
  flattenFolders,
  normalizeBookmarkTree,
  searchBookmarks,
  splitSearchHighlight,
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

  it('searches every nested bookmark and ranks title matches first', () => {
    expect(searchBookmarks(MOCK_BOOKMARK_TREE, 'Vue').map(({ node }) => node.title)).toEqual(['Vue.js'])
    expect(searchBookmarks(MOCK_BOOKMARK_TREE, 'mozilla').map(({ node }) => node.title)).toEqual(['MDN'])
    expect(searchBookmarks(MOCK_BOOKMARK_TREE, 'Git', 2).map(({ node }) => node.title)).toEqual([
      'GitHub',
      'GitHub',
    ])
    expect(searchBookmarks(MOCK_BOOKMARK_TREE, '开发工具')).toEqual([])
  })

  it('returns the containing folder path for search results', () => {
    expect(searchBookmarks(MOCK_BOOKMARK_TREE, 'Vue')[0]).toMatchObject({
      folderPath: ['书签栏', '开发工具'],
      node: { title: 'Vue.js' },
    })
  })

  it('splits matching text into highlight segments', () => {
    expect(splitSearchHighlight('Vue.js Guide', 'vue guide')).toEqual([
      { text: 'Vue', matched: true },
      { text: '.js ', matched: false },
      { text: 'Guide', matched: true },
    ])
    expect(splitSearchHighlight('GitHub', '')).toEqual([{ text: 'GitHub', matched: false }])
  })
})
