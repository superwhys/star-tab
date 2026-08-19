import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useStarPageStore } from '../stores/starPage'
import BookmarkDashboard from './BookmarkDashboard.vue'

describe('BookmarkDashboard layout shortcut', () => {
  it('offers a direct switch from the grid to the 3D sphere', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useStarPageStore()
    await store.init()

    const wrapper = mount(BookmarkDashboard, {
      props: { layout: 'grid' },
      global: { plugins: [pinia] },
    })
    await flushPromises()

    await wrapper.get('button[aria-label="切换到 3D 星球布局"]').trigger('click')
    expect(wrapper.emitted('changeLayout')?.[0]).toEqual(['constellation'])
  })
})
