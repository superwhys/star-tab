<script setup lang="ts">
import { useBookmarks } from '../composables/useBookmarks'
import type { BookmarkLayout, BookmarkNode, BookmarkSearchState } from '../types'
import BookmarkConstellationSphere from './BookmarkConstellationSphere.vue'
import BookmarkSection from './BookmarkSection.vue'
import IconSymbol from './IconSymbol.vue'

defineProps<{
  compact?: boolean
  layout?: BookmarkLayout
  motion?: boolean
  searchState?: BookmarkSearchState
}>()

const emit = defineEmits<{
  openSettings: []
  changeLayout: [layout: BookmarkLayout]
}>()

const { loading, bookmarkError, visibleSections, openFolder, refreshBookmarks } = useBookmarks()

function handleFolder(node: BookmarkNode) {
  openFolder(node)
}
</script>

<template>
  <div
    class="bookmark-dashboard"
    :class="{ 'bookmark-dashboard--constellation': layout === 'constellation' }"
  >
    <div v-if="loading" class="bookmark-skeleton" aria-label="正在加载书签">
      <span v-for="index in 8" :key="index"></span>
    </div>

    <div v-else-if="bookmarkError" class="dashboard-message dashboard-message--error">
      <p>{{ bookmarkError }}</p>
      <button type="button" @click="refreshBookmarks">
        <IconSymbol name="refresh" :size="17" />
        重新读取
      </button>
    </div>

    <BookmarkConstellationSphere
      v-else-if="visibleSections.length && layout === 'constellation'"
      :sections="visibleSections"
      :motion="motion"
      :search-state="searchState"
      @open-folder="handleFolder"
      @change-layout="emit('changeLayout', $event)"
    />

    <template v-else-if="visibleSections.length">
      <BookmarkSection
        v-for="(section, index) in visibleSections"
        :key="section.id"
        :section="section"
        :compact="compact"
        :show-layout-shortcut="index === 0"
        @open-folder="handleFolder"
        @change-layout="emit('changeLayout', 'constellation')"
      />
    </template>

    <div v-else class="dashboard-message">
      <span class="dashboard-message__star"><IconSymbol name="star" :size="24" /></span>
      <h2>还没有展示分组</h2>
      <p>从设置中选择要出现在星页上的书签文件夹。</p>
      <button type="button" @click="emit('openSettings')">选择书签分组</button>
    </div>
  </div>
</template>
