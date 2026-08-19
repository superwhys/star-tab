import { onBeforeUnmount, ref, watch } from 'vue'
import { getSearchEngine } from '../search/engines'
import { searchWithEngine } from '../services/browser'
import type { SearchEngineId } from '../types'

export function useSearch() {
  const query = ref('')
  const feedback = ref('')
  const searching = ref(false)
  let feedbackTimer: number | undefined

  async function submitSearch(engineId: SearchEngineId) {
    const text = query.value.trim()
    if (!text || searching.value) return

    searching.value = true
    feedback.value = ''
    try {
      const mode = await searchWithEngine(text, engineId)
      if (mode === 'prototype') {
        feedback.value = `原型模式：将使用${getSearchEngine(engineId).name}搜索“${text}”`
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
