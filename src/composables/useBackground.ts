import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { BACKGROUND_PRESETS } from '../data/backgrounds'
import { useSettings } from './useSettings'

export function useBackground() {
  const { settings } = useSettings()
  const prefersReducedMotion = ref(false)
  let media: MediaQueryList | undefined

  const currentBackground = computed(
    () => BACKGROUND_PRESETS.find((preset) => preset.id === settings.value.backgroundId) ?? BACKGROUND_PRESETS[0],
  )
  const shouldAnimate = computed(() => settings.value.motionEnabled && !prefersReducedMotion.value)

  function updateMotionPreference(event?: MediaQueryListEvent) {
    prefersReducedMotion.value = event?.matches ?? media?.matches ?? false
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    updateMotionPreference()
    media.addEventListener('change', updateMotionPreference)
  })

  onBeforeUnmount(() => media?.removeEventListener('change', updateMotionPreference))

  return { currentBackground, prefersReducedMotion, shouldAnimate }
}

