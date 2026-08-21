<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBookmarks } from '../composables/useBookmarks'
import { useBookmarkContextMenu } from '../composables/useBookmarkContextMenu'
import { useSearch } from '../composables/useSearch'
import { useSettings } from '../composables/useSettings'
import { getSearchEngine, SEARCH_ENGINES } from '../search/engines'
import type { BookmarkSearchState, SearchEngineId } from '../types'
import { bookmarkHostname, searchBookmarks, splitSearchHighlight } from '../utils/bookmarks'
import { normalizeDirectUrl } from '../utils/urls'
import FaviconImage from './FaviconImage.vue'
import IconSymbol from './IconSymbol.vue'

const emit = defineEmits<{
  searchStateChange: [state: BookmarkSearchState]
}>()

const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const directLink = ref<HTMLAnchorElement>()
const { query, feedback, searching, submitSearch } = useSearch()
const { openContextMenu } = useBookmarkContextMenu()
const { bookmarkTree } = useBookmarks()
const { settings, updateSettings } = useSettings()
const focused = ref(false)
const suggestionsDismissed = ref(false)
const activeIndex = ref(-1)
const engineMenuOpen = ref(false)
const selectedEngine = computed(() => getSearchEngine(settings.value.searchEngineId))
const directUrl = computed(() => normalizeDirectUrl(query.value))
const suggestions = computed(() => searchBookmarks(bookmarkTree.value, query.value, 7))
const showSuggestions = computed(
  () =>
    focused.value &&
    !engineMenuOpen.value &&
    !suggestionsDismissed.value &&
    Boolean(query.value.trim()) &&
    suggestions.value.length > 0,
)
const activeSuggestion = computed(() => suggestions.value[activeIndex.value]?.node)
const activeDescendant = computed(() =>
  activeSuggestion.value ? suggestionId(activeIndex.value) : undefined,
)
const constellationSearchState = computed<BookmarkSearchState>(() => {
  const enabled = Boolean(query.value.trim()) && !suggestionsDismissed.value
  return {
    query: enabled ? query.value.trim() : '',
    matchIds: enabled ? suggestions.value.map(({ node }) => node.id) : [],
    matches: enabled ? suggestions.value.map(({ node }) => node) : [],
    activeId: enabled ? activeSuggestion.value?.id : undefined,
  }
})

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
  if (directUrl.value) {
    directLink.value?.click()
    return
  }

  suggestionsDismissed.value = true
  await submitSearch(settings.value.searchEngineId)
}

function handleEscape() {
  if (engineMenuOpen.value) {
    engineMenuOpen.value = false
    return
  }
  activeIndex.value = -1
  suggestionsDismissed.value = true
}

function toggleEngineMenu() {
  engineMenuOpen.value = !engineMenuOpen.value
  if (engineMenuOpen.value) activeIndex.value = -1
}

async function selectEngine(engineId: SearchEngineId) {
  engineMenuOpen.value = false
  await updateSettings({ searchEngineId: engineId })
  await nextTick()
  input.value?.focus()
}

function handleFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget
  if (!(nextTarget instanceof Node) || !root.value?.contains(nextTarget)) {
    focused.value = false
    engineMenuOpen.value = false
  }
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

watch(
  constellationSearchState,
  (state) => emit('searchStateChange', {
    ...state,
    matchIds: [...state.matchIds],
    matches: [...(state.matches ?? [])],
  }),
  { immediate: true },
)

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
        :aria-label="`搜索书签或使用${selectedEngine.name}搜索网页`"
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
      <button
        type="button"
        class="search-bar__engine"
        :class="{ 'search-bar__engine--open': engineMenuOpen }"
        :aria-label="`搜索引擎：${selectedEngine.name}`"
        aria-haspopup="listbox"
        aria-controls="search-engine-options"
        :aria-expanded="engineMenuOpen"
        @click="toggleEngineMenu"
        @keydown.esc.stop.prevent="engineMenuOpen = false"
      >
        <span class="search-engine__mark" :style="{ color: selectedEngine.accent }">{{ selectedEngine.mark }}</span>
        <span class="search-bar__engine-name">{{ selectedEngine.shortName }}</span>
        <span class="search-bar__engine-caret" aria-hidden="true"></span>
      </button>
      <button
        type="submit"
        class="search-bar__submit"
        :disabled="!query.trim() || searching"
        :aria-label="activeSuggestion ? `打开书签 ${activeSuggestion.title}` : directUrl ? `直接访问 ${directUrl}` : '搜索'"
      >
        <span>↵</span>
      </button>
      <a
        v-if="directUrl"
        ref="directLink"
        class="search-bar__direct-link"
        :href="directUrl"
        tabindex="-1"
        aria-hidden="true"
      ></a>
    </form>
    <Transition name="suggestions">
      <ul
        v-if="engineMenuOpen"
        id="search-engine-options"
        class="search-engine-menu"
        role="listbox"
        aria-label="选择搜索引擎"
      >
        <li v-for="engine in SEARCH_ENGINES" :key="engine.id" role="presentation">
          <button
            type="button"
            class="search-engine-option"
            :class="{ 'search-engine-option--active': engine.id === settings.searchEngineId }"
            role="option"
            :aria-selected="engine.id === settings.searchEngineId"
            @click="selectEngine(engine.id)"
          >
            <span class="search-engine-option__mark" :style="{ color: engine.accent }">{{ engine.mark }}</span>
            <span class="search-engine-option__copy">
              <strong>{{ engine.name }}</strong>
              <small>{{ engine.description }}</small>
            </span>
            <span v-if="engine.id === settings.searchEngineId" class="search-engine-option__selected" aria-hidden="true"></span>
          </button>
        </li>
      </ul>
    </Transition>
    <Transition name="suggestions">
      <ul
        v-if="showSuggestions"
        id="bookmark-search-suggestions"
        class="search-suggestions"
        role="listbox"
        aria-label="匹配的书签"
      >
        <li v-for="({ node: bookmark, folderPath }, index) in suggestions" :key="bookmark.id">
          <a
            :id="suggestionId(index)"
            class="search-suggestion"
            :class="{ 'search-suggestion--active': activeIndex === index }"
            :href="bookmark.url"
            data-bookmark-context
            role="option"
            :aria-selected="activeIndex === index"
            @mouseenter="activeIndex = index"
            @focus="activeIndex = index"
            @contextmenu="openContextMenu(bookmark, $event)"
          >
            <FaviconImage :title="bookmark.title" :url="bookmark.url" :size="34" subtle />
            <span class="search-suggestion__copy">
              <strong>
                <template v-for="(segment, segmentIndex) in splitSearchHighlight(bookmark.title, query)" :key="segmentIndex">
                  <mark v-if="segment.matched">{{ segment.text }}</mark>
                  <template v-else>{{ segment.text }}</template>
                </template>
              </strong>
              <small class="search-suggestion__metadata">
                <span v-if="folderPath.length" class="search-suggestion__path">{{ folderPath.join(' / ') }}</span>
                <span>
                  <template v-for="(segment, segmentIndex) in splitSearchHighlight(bookmarkHostname(bookmark.url), query)" :key="segmentIndex">
                    <mark v-if="segment.matched">{{ segment.text }}</mark>
                    <template v-else>{{ segment.text }}</template>
                  </template>
                </span>
              </small>
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

<style scoped>
.search-suggestion mark {
  padding: 0;
  border-radius: 3px;
  background: rgba(132, 164, 255, 0.22);
  color: #f8faff;
}

.search-suggestion__metadata {
  display: flex;
  min-width: 0;
  gap: 7px;
}

.search-suggestion__metadata > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-suggestion__path {
  color: rgba(214, 224, 255, 0.62);
}

.search-suggestion__path::after {
  margin-left: 7px;
  color: rgba(211, 220, 249, 0.25);
  content: '·';
}
</style>
