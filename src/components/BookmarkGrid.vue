<script setup lang="ts">
import type { BookmarkNode } from '../types'
import BookmarkTile from './BookmarkTile.vue'

defineProps<{
  nodes: BookmarkNode[]
  compact?: boolean
  dialog?: boolean
}>()

const emit = defineEmits<{
  openFolder: [node: BookmarkNode]
}>()
</script>

<template>
  <div
    class="bookmark-grid"
    :class="{ 'bookmark-grid--dialog': dialog }"
  >
    <BookmarkTile
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :compact="compact"
      @open-folder="emit('openFolder', $event)"
    />
  </div>
</template>
