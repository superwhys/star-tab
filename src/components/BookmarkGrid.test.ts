import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { BookmarkNode } from '../types'
import BookmarkGrid from './BookmarkGrid.vue'

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

describe('BookmarkGrid', () => {
  it('renders bookmark tiles and forwards folder events', async () => {
    const wrapper = mount(BookmarkGrid, { props: { nodes: [page, folder] } })

    expect(wrapper.get('a.bookmark-tile').attributes('href')).toBe('https://vuejs.org')
    await wrapper.get('button.bookmark-tile').trigger('click')
    expect(wrapper.emitted('openFolder')?.[0]).toEqual([folder])
  })

  it('marks folder contents as a dialog grid without dock magnification', () => {
    const wrapper = mount(BookmarkGrid, { props: { nodes: [page], dialog: true } })

    expect(wrapper.get('.bookmark-grid').classes()).toContain('bookmark-grid--dialog')
    expect(wrapper.get('.bookmark-grid').classes()).not.toContain('bookmark-grid--dock-live')
  })
})
