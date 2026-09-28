<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getBackgroundMotionProfile } from '../backgrounds'
import { createStarField, projectStar, random, smoothNoise, type Star } from '../backgrounds/starField'
import { useBackground } from '../composables/useBackground'

interface Meteor {
  startX: number
  startY: number
  length: number
  travel: number
  duration: number
  createdAt: number
  opacity: number
}

const canvas = ref<HTMLCanvasElement>()
const { currentBackground, shouldAnimate } = useBackground()
const backgroundClass = computed(() => currentBackground.value?.className)
const pageVisible = ref(!document.hidden)
const animationActive = computed(() => shouldAnimate.value && pageVisible.value)

let context: CanvasRenderingContext2D | null = null
let animationFrame = 0
let stars: Star[] = []
let meteors: Meteor[] = []
let width = 0
let height = 0
let pointerX = 0
let pointerY = 0
let targetPointerX = 0
let targetPointerY = 0
let activeTime = 0
let previousFrame: number | null = null
let lastMeteorAt = 0

function resizeCanvas() {
  if (!canvas.value) return
  width = window.innerWidth
  height = window.innerHeight
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.value.width = Math.round(width * pixelRatio)
  canvas.value.height = Math.round(height * pixelRatio)
  canvas.value.style.width = `${width}px`
  canvas.value.style.height = `${height}px`
  context = canvas.value.getContext('2d')
  context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  stars = createStarField(width, height, getBackgroundMotionProfile(currentBackground.value?.id))
  draw()
}

function drawStarField() {
  if (!context) return
  const seconds = activeTime / 1000
  const profile = getBackgroundMotionProfile(currentBackground.value?.id)

  stars.forEach((star) => {
    const position = projectStar(star, seconds, width, height, profile)
    const x = position.x + pointerX * star.depth
    const y = position.y + pointerY * star.depth
    if (x < -16 || y < -16 || x > width + 16 || y > height + 16) return

    const time = seconds * profile.twinkleSpeed * star.twinkleRate + star.phase
    const shimmer = smoothNoise(time, star.phase * 37) * 0.75
      + smoothNoise(time * 2.7, star.phase * 61) * 0.25
    const strength = Math.min(star.opacity * profile.twinkleAmount * star.twinkleStrength, 1 - star.opacity)
    const opacity = star.opacity + shimmer * strength

    if (profile.distribution === 'orbit' && star.radius > 0.65) {
      const centerX = width * 0.72 + pointerX * star.depth
      const centerY = height * 0.24 + pointerY * star.depth
      const radius = Math.hypot(x - centerX, y - centerY)
      const angle = Math.atan2(y - centerY, x - centerX)
      context!.beginPath()
      context!.strokeStyle = `rgba(${star.color}, ${opacity * 0.32})`
      context!.lineWidth = star.radius * 0.75
      context!.arc(centerX, centerY, radius, angle - 0.045, angle)
      context!.stroke()
    }

    // 只给少量亮星加紧贴星点的散射光，不使用十字星芒或大光圈。
    if (star.radius > 1.2) {
      const glowRadius = star.radius * 3
      const glow = context!.createRadialGradient(x, y, 0, x, y, glowRadius)
      glow.addColorStop(0, `rgba(${star.color}, ${opacity * 0.25})`)
      glow.addColorStop(0.35, `rgba(${star.color}, ${opacity * 0.06})`)
      glow.addColorStop(1, `rgba(${star.color}, 0)`)
      context!.beginPath()
      context!.fillStyle = glow
      context!.arc(x, y, glowRadius, 0, Math.PI * 2)
      context!.fill()
    }

    context!.beginPath()
    context!.fillStyle = `rgba(${star.color}, ${opacity})`
    context!.arc(x, y, star.radius, 0, Math.PI * 2)
    context!.fill()
  })
}

function drawMeteors() {
  if (!context) return
  const kind = currentBackground.value?.kind
  const profile = getBackgroundMotionProfile(currentBackground.value?.id)

  if (
    animationActive.value
    && profile.meteorInterval > 0
    && activeTime - lastMeteorAt > profile.meteorInterval
    && !meteors.length
  ) {
    const seed = random(lastMeteorAt + 17)
    meteors.push({
      startX: width * (0.55 + seed * 0.4),
      startY: height * (0.04 + random(lastMeteorAt + 31) * 0.22),
      length: kind === 'canvas-meteor' ? 130 : kind === 'ambient' ? 65 : 90,
      travel: Math.max(width * 0.46, 560),
      duration: kind === 'canvas-meteor' ? 1050 : kind === 'ambient' ? 1550 : 1300,
      createdAt: activeTime,
      opacity: kind === 'canvas-meteor' ? 0.5 : kind === 'ambient' ? 0.18 : 0.28,
    })
    lastMeteorAt = activeTime
  }

  meteors = meteors.filter((meteor) => activeTime - meteor.createdAt < meteor.duration)
  meteors.forEach((meteor) => {
    const progress = (activeTime - meteor.createdAt) / meteor.duration
    const x = meteor.startX - meteor.travel * progress
    const y = meteor.startY + meteor.travel * 0.5 * progress
    const opacity = Math.sin(progress * Math.PI) * meteor.opacity
    const gradient = context!.createLinearGradient(x, y, x + meteor.length, y - meteor.length * 0.5)
    gradient.addColorStop(0, `rgba(235, 242, 255, ${opacity})`)
    gradient.addColorStop(1, 'rgba(145, 175, 255, 0)')
    context!.beginPath()
    context!.strokeStyle = gradient
    context!.lineWidth = kind === 'canvas-meteor' ? 1 : 0.7
    context!.moveTo(x, y)
    context!.lineTo(x + meteor.length, y - meteor.length * 0.5)
    context!.stroke()
  })
}

function draw() {
  if (!context) return
  context.clearRect(0, 0, width, height)
  drawStarField()
  drawMeteors()
}

function animate(time: number) {
  if (!animationActive.value) return
  const delta = previousFrame === null ? 0 : Math.min(time - previousFrame, 50)
  previousFrame = time
  activeTime += delta
  const follow = 1 - Math.exp(-delta / 350)
  pointerX += (targetPointerX - pointerX) * follow
  pointerY += (targetPointerY - pointerY) * follow
  draw()
  animationFrame = requestAnimationFrame(animate)
}

function restartAnimation() {
  cancelAnimationFrame(animationFrame)
  previousFrame = null
  draw()
  if (animationActive.value) animationFrame = requestAnimationFrame(animate)
}

function handlePointer(event: PointerEvent) {
  if (!animationActive.value || event.pointerType === 'touch') return
  targetPointerX = (event.clientX / Math.max(width, 1) - 0.5) * -18
  targetPointerY = (event.clientY / Math.max(height, 1) - 0.5) * -12
}

function handleVisibility() {
  pageVisible.value = !document.hidden
}

watch(animationActive, restartAnimation)
watch(() => currentBackground.value?.id, () => {
  activeTime = 0
  meteors = []
  lastMeteorAt = 0
  stars = createStarField(width, height, getBackgroundMotionProfile(currentBackground.value?.id))
  restartAnimation()
})

onMounted(() => {
  resizeCanvas()
  restartAnimation()
  window.addEventListener('resize', resizeCanvas, { passive: true })
  window.addEventListener('pointermove', handlePointer, { passive: true })
  document.addEventListener('visibilitychange', handleVisibility)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('pointermove', handlePointer)
  document.removeEventListener('visibilitychange', handleVisibility)
})
</script>

<template>
  <div class="star-background" :class="backgroundClass" :data-animated="animationActive" aria-hidden="true">
    <canvas ref="canvas" class="star-background__canvas" :data-animated="animationActive"></canvas>
    <div class="star-background__nebula"></div>
    <div class="star-background__vignette"></div>
    <div class="star-background__grain"></div>
  </div>
</template>
