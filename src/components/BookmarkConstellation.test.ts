import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { MOCK_BOOKMARK_TREE } from '../data/mockBookmarks'
import { findBookmarkNode, findDefaultBookmarkFolder } from '../utils/bookmarks'
import BookmarkConstellationSphere from './BookmarkConstellationSphere.vue'

describe('BookmarkConstellationSphere', () => {
  it('keeps bookmarks as native links and opens folders through an event', async () => {
    const section = findDefaultBookmarkFolder(MOCK_BOOKMARK_TREE)!
    const wrapper = mount(BookmarkConstellationSphere, { props: { sections: [section], motion: false } })
    const link = wrapper.get('a.constellation-node--bookmark')
    const folder = wrapper.get('button.constellation-node--section')

    expect(link.attributes('href')).toMatch(/^https:/)
    await folder.trigger('click')
    expect(wrapper.emitted('openFolder')?.[0]).toEqual([section])
  })

  it('offers zoom controls and keyboard-accessible sphere instructions', async () => {
    const section = findDefaultBookmarkFolder(MOCK_BOOKMARK_TREE)!
    const wrapper = mount(BookmarkConstellationSphere, { props: { sections: [section], motion: false } })

    expect(wrapper.attributes('aria-label')).toContain('旋转和缩放')
    expect(wrapper.get('output').text()).toBe('118%')
    await wrapper.get('.constellation-node').trigger('wheel', { deltaY: -100 })
    expect(wrapper.get('output').text()).toBe('132%')
    await wrapper.get('button[aria-label="放大星图"]').trigger('click')
    expect(wrapper.get('output').text()).toBe('144%')
    await wrapper.get('button[aria-label="切换到普通宫格布局"]').trigger('click')
    expect(wrapper.emitted('changeLayout')?.[0]).toEqual(['grid'])
    expect(wrapper.text()).toContain('拖拽旋转')
  })

  it('highlights a searched bookmark, focuses the camera and restores the previous zoom', async () => {
    const section = findDefaultBookmarkFolder(MOCK_BOOKMARK_TREE)!
    const wrapper = mount(BookmarkConstellationSphere, {
      props: {
        sections: [section],
        motion: false,
        searchState: { query: 'Vue', matchIds: ['111'], activeId: '111' },
      },
    })

    const target = wrapper.get('[data-constellation-node-id="section:1:node:111"]')
    expect(target.classes()).toContain('constellation-node--search-match')
    expect(target.classes()).toContain('constellation-node--search-focus')
    expect(wrapper.get('.constellation-search-status').text()).toContain('Vue.js')
    expect(wrapper.get('output').text()).toBe('152%')

    await wrapper.setProps({ searchState: { query: '', matchIds: [] } })
    expect(wrapper.find('.constellation-search-status').exists()).toBe(false)
    expect(wrapper.get('output').text()).toBe('118%')

    const deepBookmark = findBookmarkNode(MOCK_BOOKMARK_TREE, '118')!
    await wrapper.setProps({
      searchState: { query: 'GitLab', matchIds: ['118'], matches: [deepBookmark], activeId: '118' },
    })
    const temporaryTarget = wrapper.get('[data-constellation-node-id="search:node:118"]')
    expect(temporaryTarget.attributes('href')).toBe('https://gitlab.com')
    expect(temporaryTarget.classes()).toContain('constellation-node--search-focus')
  })
})
