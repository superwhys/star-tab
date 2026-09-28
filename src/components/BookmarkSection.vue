<script setup lang="ts">
import type { BookmarkNode } from '../types'
import { useBookmarkEditor } from '../composables/useBookmarkEditor'
import BookmarkGrid from './BookmarkGrid.vue'
import IconSymbol from './IconSymbol.vue'

defineProps<{
  section: BookmarkNode
  compact?: boolean
}>()

const emit = defineEmits<{
  openFolder: [node: BookmarkNode]
}>()

const { openCreateBookmark } = useBookmarkEditor()
</script>

<template>
  <section class="bookmark-section" :aria-labelledby="`section-${section.id}`">
    <div class="bookmark-section__header">
      <div class="bookmark-section__heading">
        <IconSymbol name="folder" :size="16" />
        <h2 :id="`section-${section.id}`">{{ section.title || '书签' }}</h2>
        <span class="bookmark-section__count">{{ section.children.length }}</span>
      </div>
      <div class="bookmark-section__actions">
        <button
          type="button"
          class="bookmark-section__add-button"
          :aria-label="`在${section.title || '书签'}新增书签`"
          @click="openCreateBookmark(section)"
        >
          <span aria-hidden="true">＋</span> 添加书签
        </button>
      </div>
    </div>
    <BookmarkGrid
      v-if="section.children.length"
      :nodes="section.children"
      :compact="compact"
      @open-folder="emit('openFolder', $event)"
    />
    <div v-else class="section-empty">这个文件夹还没有书签</div>
  </section>
</template>

<style scoped>
.bookmark-section__heading,
.bookmark-section__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bookmark-section__heading {
  min-width: 0;
  color: var(--moon-muted);
}

.bookmark-section__heading > .icon-symbol {
  flex: none;
}

.bookmark-section__count {
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(173, 194, 224, 0.07);
  color: var(--moon-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.bookmark-section__actions {
  flex: none;
}

.bookmark-section__add-button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--moon-muted);
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, color 150ms ease;
}

.bookmark-section__add-button > span {
  font-size: 16px;
}

.bookmark-section__add-button:hover,
.bookmark-section__add-button:focus-visible {
  border-color: var(--glass-border);
  background: rgba(137, 162, 233, 0.06);
  color: var(--moon);
}
</style>
