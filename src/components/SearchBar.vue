<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBookmarks } from '../composables/useBookmarks'
import { useSearch } from '../composables/useSearch'
import { bookmarkHostname, searchBookmarks } from '../utils/bookmarks'
import FaviconImage from './FaviconImage.vue'
import IconSymbol from './IconSymbol.vue'

const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const { query, feedback, searching, submitSearch } = useSearch()
const { bookmarkTree } = useBookmarks()
const focused = ref(false)
const suggestionsDismissed = ref(false)
const activeIndex = ref(-1)
const suggestions = computed(() => searchBookmarks(bookmarkTree.value, query.value, 7))
const showSuggestions = computed(
  () => focused.value && !suggestionsDismissed.value && Boolean(query.value.trim()) && suggestions.value.length > 0,
)
const activeSuggestion = computed(() => suggestions.value[activeIndex.value])
const activeDescendant = computed(() =>
  activeSuggestion.value ? suggestionId(activeIndex.value) : undefined,
)

function suggestionId(index: number) {
  return `bookmark-search-option-${index}`
}

function moveSelection(direction: 1 | -1) {
  const count = suggestions.value.length
  if (count === 0) return
  suggestionsDismissed.value = false
  activeIndex.value = (activeIndex.value + direction + count) % count
  void nextTick(() => document.getElementById(suggestionId(activeIndex.value))?.scrollIntoView({ block: 'nearest' }))
}

async function handleSubmit() {
  const selected = activeSuggestion.value
  if (selected?.url) {
    document.getElementById(suggestionId(activeIndex.value))?.click()
    return
  }

  suggestionsDismissed.value = true
  await submitSearch()
}

function handleEscape() {
  activeIndex.value = -1
  suggestionsDismissed.value = true
}

function handleFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget
  if (!(nextTarget instanceof Node) || !root.value?.contains(nextTarget)) focused.value = false
}

function handleShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  if (event.key === '/' && !isTyping) {
    event.preventDefault()
    input.value?.focus()
  }
}

watch(query, () => {
  activeIndex.value = -1
  suggestionsDismissed.value = false
})

watch(suggestions, (items) => {
  if (activeIndex.value >= items.length) activeIndex.value = -1
})

onMounted(() => window.addEventListener('keydown', handleShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handleShortcut))
</script>

<template>
  <div ref="root" class="search-area" @focusin="focused = true" @focusout="handleFocusOut">
    <form class="search-bar" role="search" @submit.prevent="handleSubmit">
      <IconSymbol name="search" :size="21" />
      <input
        ref="input"
        v-model="query"
        type="search"
        name="q"
        autocomplete="off"
        spellcheck="false"
        aria-label="使用默认搜索引擎搜索"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="bookmark-search-suggestions"
        :aria-expanded="showSuggestions"
        :aria-activedescendant="activeDescendant"
        placeholder="搜索书签或网页…"
        @keydown.down.prevent="moveSelection(1)"
        @keydown.up.prevent="moveSelection(-1)"
        @keydown.esc.prevent="handleEscape"
      />
      <span class="search-bar__engine">{{ activeSuggestion ? '打开书签' : '默认搜索' }}</span>
      <button
        type="submit"
        class="search-bar__submit"
        :disabled="!query.trim() || searching"
        :aria-label="activeSuggestion ? `打开书签 ${activeSuggestion.title}` : '搜索'"
      >
        <span>↵</span>
      </button>
    </form>
    <Transition name="suggestions">
      <ul
        v-if="showSuggestions"
        id="bookmark-search-suggestions"
        class="search-suggestions"
        role="listbox"
        aria-label="匹配的书签"
      >
        <li v-for="(bookmark, index) in suggestions" :key="bookmark.id">
          <a
            :id="suggestionId(index)"
            class="search-suggestion"
            :class="{ 'search-suggestion--active': activeIndex === index }"
            :href="bookmark.url"
            role="option"
            :aria-selected="activeIndex === index"
            @mouseenter="activeIndex = index"
            @focus="activeIndex = index"
          >
            <FaviconImage :title="bookmark.title" :url="bookmark.url" :size="34" subtle />
            <span class="search-suggestion__copy">
              <strong>{{ bookmark.title }}</strong>
              <small>{{ bookmarkHostname(bookmark.url) }}</small>
            </span>
            <span class="search-suggestion__hint">打开 ↵</span>
          </a>
        </li>
      </ul>
    </Transition>
    <Transition name="feedback">
      <p v-if="feedback" class="search-area__feedback" role="status">{{ feedback }}</p>
    </Transition>
  </div>
</template>
