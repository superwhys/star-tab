import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useStarPageStore } from '../stores/starPage'
import BookmarkDashboard from './BookmarkDashboard.vue'

describe('BookmarkDashboard', () => {
  it('renders all selected sections in order and keeps bookmarks and folders accessible', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useStarPageStore()
    await store.init()
    await store.updateSettings({ visibleFolderIds: ['1', '120', '110'] })

    const wrapper = mount(BookmarkDashboard, {
      global: { plugins: [pinia] },
    })
    await flushPromises()

    expect(wrapper.findAll('.bookmark-section h2').map((heading) => heading.text())).toEqual([
      '书签栏',
      '设计灵感',
      '开发工具',
    ])
    expect(wrapper.get('a[aria-label="打开 GitHub"]').attributes('href')).toBe('https://github.com')
    expect(wrapper.get('a[aria-label="打开 Dribbble"]').attributes('href')).toBe('https://dribbble.com')
    expect(wrapper.get('a[aria-label="打开 Vue.js"]').attributes('href')).toBe('https://vuejs.org')

    await wrapper.get('button[aria-label="打开文件夹 开发工具"]').trigger('click')
    expect(store.activeFolder?.id).toBe('110')
    wrapper.unmount()
  })

  it('opens settings when no bookmark groups are selected', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useStarPageStore()
    await store.init()
    await store.updateSettings({ visibleFolderIds: [] })

    const wrapper = mount(BookmarkDashboard, {
      global: { plugins: [pinia] },
    })
    await flushPromises()

    await wrapper.get('.dashboard-message button').trigger('click')
    expect(wrapper.emitted('openSettings')).toHaveLength(1)
    wrapper.unmount()
  })
})
