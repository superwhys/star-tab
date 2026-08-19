<script setup lang="ts">
import { useClock } from '../composables/useClock'

defineProps<{
  showSeconds: boolean
}>()

const { hours, minutes, seconds, dateLabel } = useClock()
</script>

<template>
  <header class="clock" aria-label="当前时间">
    <div class="clock__orbit" aria-hidden="true">
      <span class="clock__orbit-line clock__orbit-line--one"></span>
      <span class="clock__orbit-line clock__orbit-line--two"></span>
      <span class="clock__orbit-star clock__orbit-star--one"></span>
      <span class="clock__orbit-star clock__orbit-star--two"></span>
    </div>
    <div class="clock__time">
      <span>{{ hours }}</span><span class="clock__colon">:</span><span>{{ minutes }}</span>
      <span v-if="showSeconds" class="clock__seconds">{{ seconds }}</span>
    </div>
    <p class="clock__date">{{ dateLabel }}</p>
  </header>
</template>

