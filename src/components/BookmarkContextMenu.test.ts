import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBookmarkContextMenu } from '../composables/useBookmarkContextMenu'
import { useBookmarkEditor } from '../composables/useBookmarkEditor'
import type { BookmarkNode } from '../types'
import BookmarkContextMenu from './BookmarkContextMenu.vue'

const bookmark: BookmarkNode = {
  id: '1',
  title: 'Vue.js',
  type: 'bookmark',
  url: 'https://vuejs.org',
  children: [],
}

afterEach(() => {
  useBookmarkContextMenu().closeContextMenu()
  useBookmarkEditor().closeBookmarkEditor()
  vi.unstubAllGlobals()
})

describe('BookmarkContextMenu scrolling', () => {
  it('keeps menu actions available when an earlier scroll event arrives after opening', async () => {
    vi.stubGlobal('scrollY', 120)
    const wrapper = mount(BookmarkContextMenu, {
      global: { plugins: [createPinia()], stubs: { teleport: true } },
    })
    const { openContextMenu, contextMenu } = useBookmarkContextMenu()
    openContextMenu(bookmark, new MouseEvent('contextmenu', { clientX: 40, clientY: 200 }))
    await flushPromises()

    document.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(contextMenu.value?.node).toEqual(bookmark)

    await wrapper.get('.bookmark-context-menu__danger').trigger('click')
    expect(useBookmarkEditor().editorState.value).toEqual({ mode: 'delete', bookmark })
    wrapper.unmount()
  })

  it('dismisses the menu when the page actually scrolls after opening', async () => {
    vi.stubGlobal('scrollY', 120)
    const wrapper = mount(BookmarkContextMenu, {
      global: { plugins: [createPinia()], stubs: { teleport: true } },
    })
    const { openContextMenu, contextMenu } = useBookmarkContextMenu()
    openContextMenu(bookmark, new MouseEvent('contextmenu', { clientX: 40, clientY: 200 }))
    await flushPromises()

    vi.stubGlobal('scrollY', 180)
    document.dispatchEvent(new Event('scroll'))
    expect(contextMenu.value).toBeUndefined()
    wrapper.unmount()
  })
})
