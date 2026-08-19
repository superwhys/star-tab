<script setup lang="ts">
import type { BookmarkNode } from '../types'
import FaviconImage from './FaviconImage.vue'
import IconSymbol from './IconSymbol.vue'

defineProps<{
  node: BookmarkNode
  compact?: boolean
}>()

const emit = defineEmits<{
  openFolder: [node: BookmarkNode]
}>()
</script>

<template>
  <a
    v-if="node.type === 'bookmark'"
    class="bookmark-tile"
    :class="{ 'bookmark-tile--compact': compact }"
    :href="node.url"
    :aria-label="`打开 ${node.title}`"
  >
    <FaviconImage :title="node.title" :url="node.url" :size="64" />
    <span class="bookmark-tile__title" :title="node.title">{{ node.title }}</span>
  </a>

  <button
    v-else
    type="button"
    class="bookmark-tile bookmark-tile--folder"
    :class="{ 'bookmark-tile--compact': compact }"
    :aria-label="`打开文件夹 ${node.title}`"
    @click="emit('openFolder', node)"
  >
    <span class="folder-preview" aria-hidden="true">
      <span v-if="node.children.length === 0" class="folder-preview__empty">
        <IconSymbol name="folder" :size="25" />
      </span>
      <template v-else>
        <FaviconImage
          v-for="child in node.children.slice(0, 4)"
          :key="child.id"
          :title="child.title"
          :url="child.url"
          :size="28"
          subtle
        />
      </template>
    </span>
    <span class="bookmark-tile__title" :title="node.title">{{ node.title }}</span>
  </button>
</template>

