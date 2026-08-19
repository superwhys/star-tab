import { onBeforeUnmount, ref, watch } from 'vue'
import { searchWithDefaultEngine } from '../services/browser'

export function useSearch() {
  const query = ref('')
  const feedback = ref('')
  const searching = ref(false)
  let feedbackTimer: number | undefined

  async function submitSearch() {
    const text = query.value.trim()
    if (!text || searching.value) return

    searching.value = true
    feedback.value = ''
    try {
      const mode = await searchWithDefaultEngine(text)
      if (mode === 'prototype') {
        feedback.value = `原型模式：将使用默认搜索引擎搜索“${text}”`
        window.clearTimeout(feedbackTimer)
        feedbackTimer = window.setTimeout(() => (feedback.value = ''), 3200)
      }
    } catch {
      feedback.value = '搜索暂时不可用，请稍后重试'
    } finally {
      searching.value = false
    }
  }

  watch(query, () => {
    feedback.value = ''
    window.clearTimeout(feedbackTimer)
  })

  onBeforeUnmount(() => window.clearTimeout(feedbackTimer))

  return { query, feedback, searching, submitSearch }
}
