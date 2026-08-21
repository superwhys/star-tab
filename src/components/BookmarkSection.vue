<script setup lang="ts">
import type { BookmarkNode } from '../types'
import { useBookmarkEditor } from '../composables/useBookmarkEditor'
import BookmarkGrid from './BookmarkGrid.vue'

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
      <h2 :id="`section-${section.id}`">{{ section.title || '书签' }}</h2>
      <div class="bookmark-section__actions">
        <span>{{ section.children.length }} 项</span>
        <button type="button" :aria-label="`在${section.title || '书签'}新增书签`" @click="openCreateBookmark(section)">
          ＋ 新增
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
.bookmark-section__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bookmark-section__actions button {
  padding: 5px 9px;
  border: 1px solid rgba(202, 215, 255, 0.11);
  border-radius: 8px;
  background: rgba(133, 157, 224, 0.07);
  color: rgba(213, 224, 255, 0.55);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.bookmark-section__actions button:hover,
.bookmark-section__actions button:focus-visible {
  border-color: rgba(202, 215, 255, 0.2);
  color: rgba(242, 246, 255, 0.9);
}
</style>
