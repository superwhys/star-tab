<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useSearch } from '../composables/useSearch'
import IconSymbol from './IconSymbol.vue'

const input = ref<HTMLInputElement>()
const { query, feedback, searching, submitSearch } = useSearch()

function handleShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  if (event.key === '/' && !isTyping) {
    event.preventDefault()
    input.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', handleShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handleShortcut))
</script>

<template>
  <div class="search-area">
    <form class="search-bar" role="search" @submit.prevent="submitSearch">
      <IconSymbol name="search" :size="21" />
      <input
        ref="input"
        v-model="query"
        type="search"
        name="q"
        autocomplete="off"
        spellcheck="false"
        aria-label="使用默认搜索引擎搜索"
        placeholder="在星海中搜索…"
      />
      <span class="search-bar__engine">默认搜索</span>
      <button type="submit" class="search-bar__submit" :disabled="!query.trim() || searching" aria-label="搜索">
        <span>↵</span>
      </button>
    </form>
    <Transition name="feedback">
      <p v-if="feedback" class="search-area__feedback" role="status">{{ feedback }}</p>
    </Transition>
  </div>
</template>

