<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { faviconUrl } from '../services/browser'
import { bookmarkAccent, bookmarkInitial } from '../utils/bookmarks'

const props = withDefaults(
  defineProps<{
    title: string
    url?: string
    size?: number
    subtle?: boolean
  }>(),
  { size: 64, subtle: false },
)

const failed = ref(false)
const source = computed(() => faviconUrl(props.url, props.size))
const accent = computed(() => bookmarkAccent(props.url || props.title))
const initial = computed(() => bookmarkInitial(props.title))

watch(() => props.url, () => (failed.value = false))
</script>

<template>
  <span
    class="favicon"
    :class="[`favicon--${accent}`, { 'favicon--subtle': subtle }]"
    :style="{ '--favicon-size': `${size}px` }"
    aria-hidden="true"
  >
    <img v-if="source && !failed" :src="source" alt="" @error="failed = true" />
    <span v-else>{{ initial }}</span>
  </span>
</template>

