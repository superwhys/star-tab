import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { BookmarkNode } from '../types'
import BookmarkTile from './BookmarkTile.vue'
import { useBookmarkContextMenu } from '../composables/useBookmarkContextMenu'

const page: BookmarkNode = {
  id: '1',
  title: 'Vue.js',
  type: 'bookmark',
  url: 'https://vuejs.org',
  children: [],
}

const folder: BookmarkNode = {
  id: '2',
  title: '开发工具',
  type: 'folder',
  children: [page],
}

describe('BookmarkTile', () => {
  it('renders a bookmark as a native link with fallback icon', () => {
    const wrapper = mount(BookmarkTile, { props: { node: page } })
    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('https://vuejs.org')
    expect(wrapper.text()).toContain('Vue.js')
    expect(wrapper.find('.favicon > span').text()).toBe('V')
  })

  it('opens the custom context menu on right click', async () => {
    const wrapper = mount(BookmarkTile, { props: { node: page } })
    await wrapper.get('a').trigger('contextmenu', { clientX: 120, clientY: 80 })

    expect(useBookmarkContextMenu().contextMenu.value).toMatchObject({ node: page, x: 120, y: 80 })
    useBookmarkContextMenu().closeContextMenu()
  })

  it('emits a folder event without creating a link', async () => {
    const wrapper = mount(BookmarkTile, { props: { node: folder } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('openFolder')?.[0]).toEqual([folder])
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.find('.bookmark-tile__count').exists()).toBe(false)
  })
})
