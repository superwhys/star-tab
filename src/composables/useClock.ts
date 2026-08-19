import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const pad = (value: number) => String(value).padStart(2, '0')

export function useClock() {
  const now = ref(new Date())
  let timer: number | undefined

  const hours = computed(() => pad(now.value.getHours()))
  const minutes = computed(() => pad(now.value.getMinutes()))
  const seconds = computed(() => pad(now.value.getSeconds()))
  const dateLabel = computed(() =>
    new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(now.value),
  )

  function tick() {
    now.value = new Date()
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 8)
  }

  function syncWhenVisible() {
    if (!document.hidden) now.value = new Date()
  }

  onMounted(() => {
    tick()
    document.addEventListener('visibilitychange', syncWhenVisible)
  })

  onBeforeUnmount(() => {
    window.clearTimeout(timer)
    document.removeEventListener('visibilitychange', syncWhenVisible)
  })

  return { now, hours, minutes, seconds, dateLabel }
}

