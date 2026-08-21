<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDockMagnify } from '../composables/useDockMagnify'
import type { BookmarkNode } from '../types'
import BookmarkTile from './BookmarkTile.vue'

const props = defineProps<{
  nodes: BookmarkNode[]
  compact?: boolean
  dialog?: boolean
}>()

const emit = defineEmits<{
  openFolder: [node: BookmarkNode]
}>()

const gridRef = ref<HTMLElement | null>(null)
const dockEnabled = computed(() => !props.dialog)
useDockMagnify(gridRef, dockEnabled)
</script>

<template>
  <div
    ref="gridRef"
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
