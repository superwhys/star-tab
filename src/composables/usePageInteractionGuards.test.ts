import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { usePageInteractionGuards } from './usePageInteractionGuards'

const TestHost = defineComponent({
  setup() {
    usePageInteractionGuards()
  },
  template: '<div><span data-page-text>星页</span><button data-bookmark-context>书签</button><input aria-label="搜索" /></div>',
})

describe('usePageInteractionGuards', () => {
  it('blocks the context menu and native dragging', () => {
    const wrapper = mount(TestHost, { attachTo: document.body })
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    const dragEvent = new Event('dragstart', { bubbles: true, cancelable: true })

    wrapper.get('[data-page-text]').element.dispatchEvent(contextMenuEvent)
    wrapper.get('[data-page-text]').element.dispatchEvent(dragEvent)

    expect(contextMenuEvent.defaultPrevented).toBe(true)
    expect(dragEvent.defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('allows bookmarks to open the custom context menu', () => {
    const wrapper = mount(TestHost, { attachTo: document.body })
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })

    wrapper.get('[data-bookmark-context]').element.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    wrapper.unmount()
  })

  it('blocks page text selection but keeps the search input editable', () => {
    const wrapper = mount(TestHost, { attachTo: document.body })
    const pageSelection = new Event('selectstart', { bubbles: true, cancelable: true })
    const inputSelection = new Event('selectstart', { bubbles: true, cancelable: true })

    wrapper.get('[data-page-text]').element.dispatchEvent(pageSelection)
    wrapper.get('input').element.dispatchEvent(inputSelection)

    expect(pageSelection.defaultPrevented).toBe(true)
    expect(inputSelection.defaultPrevented).toBe(false)
    wrapper.unmount()
  })
})
