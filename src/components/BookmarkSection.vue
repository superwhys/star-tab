<script setup lang="ts">
import type { BookmarkNode } from '../types'
import { useBookmarkEditor } from '../composables/useBookmarkEditor'
import BookmarkGrid from './BookmarkGrid.vue'

defineProps<{
  section: BookmarkNode
  compact?: boolean
  showLayoutShortcut?: boolean
}>()

const emit = defineEmits<{
  openFolder: [node: BookmarkNode]
  changeLayout: []
}>()

const { openCreateBookmark } = useBookmarkEditor()
</script>

<template>
  <section class="bookmark-section" :aria-labelledby="`section-${section.id}`">
    <div class="bookmark-section__header">
      <h2 :id="`section-${section.id}`">{{ section.title || '书签' }}</h2>
      <div class="bookmark-section__actions">
        <span class="bookmark-section__count">{{ section.children.length }} 项</span>
        <button
          v-if="showLayoutShortcut"
          type="button"
          class="bookmark-section__layout-button"
          aria-label="切换到 3D 星球布局"
          title="切换到 3D 星球"
          @click="emit('changeLayout')"
        >
          <span aria-hidden="true">◉</span>
          3D 星球
        </button>
        <button
          type="button"
          class="bookmark-section__add-button"
          :aria-label="`在${section.title || '书签'}新增书签`"
          @click="openCreateBookmark(section)"
        >
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
  flex: none;
  align-items: center;
  gap: 7px;
}

.bookmark-section__count {
  margin-right: 3px;
  color: rgba(217, 225, 255, 0.34);
  font-size: 10px;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.bookmark-section__layout-button,
.bookmark-section__add-button {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid rgba(202, 215, 255, 0.11);
  border-radius: 10px;
  background: rgba(133, 157, 224, 0.07);
  color: rgba(213, 224, 255, 0.55);
  font: inherit;
  font-size: 9px;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, color 150ms ease, transform 150ms ease;
}

.bookmark-section__layout-button {
  background: rgba(10, 14, 36, 0.54);
  box-shadow: 0 8px 24px rgba(1, 3, 18, 0.16);
  backdrop-filter: blur(16px);
}

.bookmark-section__layout-button > span {
  color: #9eb7ff;
  font-size: 12px;
  text-shadow: 0 0 9px rgba(113, 143, 234, 0.8);
}

.bookmark-section__layout-button:hover,
.bookmark-section__layout-button:focus-visible,
.bookmark-section__add-button:hover,
.bookmark-section__add-button:focus-visible {
  border-color: rgba(202, 215, 255, 0.2);
  background: rgba(137, 162, 233, 0.13);
  color: rgba(242, 246, 255, 0.9);
  transform: translateY(-1px);
}
</style>
