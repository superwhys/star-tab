<script setup lang="ts">
import type { BookmarkNode } from '../types'
import BookmarkTile from './BookmarkTile.vue'

defineProps<{
  section: BookmarkNode
  compact?: boolean
}>()

const emit = defineEmits<{
  openFolder: [node: BookmarkNode]
}>()
</script>

<template>
  <section class="bookmark-section" :aria-labelledby="`section-${section.id}`">
    <div class="bookmark-section__header">
      <h2 :id="`section-${section.id}`">{{ section.title || '书签' }}</h2>
      <span>{{ section.children.length }} 项</span>
    </div>
    <div v-if="section.children.length" class="bookmark-grid">
      <BookmarkTile
        v-for="node in section.children"
        :key="node.id"
        :node="node"
        :compact="compact"
        @open-folder="emit('openFolder', $event)"
      />
    </div>
    <div v-else class="section-empty">这个文件夹还没有书签</div>
  </section>
</template>

