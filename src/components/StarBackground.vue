<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBackground } from '../composables/useBackground'

interface Star {
  x: number
  y: number
  radius: number
  opacity: number
  speed: number
  phase: number
  depth: number
}

interface DustParticle {
  x: number
  y: number
  radius: number
  opacity: number
  speed: number
  phase: number
  depth: number
  hue: number
}

interface Meteor {
  startX: number
  startY: number
  length: number
  travel: number
  duration: number
  createdAt: number
  opacity: number
}

interface MotionProfile {
  starSpeed: number
  dustSpeed: number
  verticalRatio: number
  direction: 1 | -1
  twinkleSpeed: number
  twinkleAmount: number
  meteorInterval: number
}

const canvas = ref<HTMLCanvasElement>()
const { currentBackground, shouldAnimate } = useBackground()
const backgroundClass = computed(() => currentBackground.value?.className)

let context: CanvasRenderingContext2D | null = null
let animationFrame = 0
let stars: Star[] = []
let dustParticles: DustParticle[] = []
let meteors: Meteor[] = []
let width = 0
let height = 0
let pixelRatio = 1
let pointerX = 0
let pointerY = 0
let targetPointerX = 0
let targetPointerY = 0
let lastMeteorAt = 0

function getMotionProfile(): MotionProfile {
  switch (currentBackground.value?.kind) {
    case 'canvas-meteor':
      return {
        starSpeed: 11.5,
        dustSpeed: 21,
        verticalRatio: 0.42,
        direction: -1,
        twinkleSpeed: 2.25,
        twinkleAmount: 0.34,
        meteorInterval: 1850,
      }
    case 'ambient':
      return {
        starSpeed: 7.8,
        dustSpeed: 15,
        verticalRatio: 0.3,
        direction: 1,
        twinkleSpeed: 1.8,
        twinkleAmount: 0.3,
        meteorInterval: 5600,
      }
    default:
      return {
        starSpeed: 14.5,
        dustSpeed: 26,
        verticalRatio: 0.36,
        direction: 1,
        twinkleSpeed: 2.05,
        twinkleAmount: 0.32,
        meteorInterval: 4200,
      }
  }
}

function createStars() {
  const count = Math.min(230, Math.max(100, Math.round((width * height) / 9200)))
  stars = Array.from({ length: count }, (_, index) => {
    const seed = Math.sin((index + 1) * 78.233) * 43758.5453
    const secondSeed = Math.sin((index + 11) * 31.117) * 17321.173
    const randomA = seed - Math.floor(seed)
    const randomB = secondSeed - Math.floor(secondSeed)
    return {
      x: randomA * width,
      y: randomB * height,
      radius: 0.45 + ((index * 17) % 100) / 76,
      opacity: 0.22 + ((index * 29) % 70) / 100,
      speed: 0.45 + ((index * 13) % 70) / 70,
      phase: randomB * Math.PI * 2,
      depth: 0.2 + ((index * 7) % 80) / 100,
    }
  })

  const dustCount = Math.min(28, Math.max(16, Math.round((width * height) / 68000)))
  dustParticles = Array.from({ length: dustCount }, (_, index) => {
    const seed = Math.sin((index + 31) * 63.913) * 29754.113
    const secondSeed = Math.sin((index + 73) * 22.731) * 19831.337
    const randomA = seed - Math.floor(seed)
    const randomB = secondSeed - Math.floor(secondSeed)
    return {
      x: randomA * width,
      y: randomB * height,
      radius: 1.3 + ((index * 11) % 25) / 10,
      opacity: 0.1 + ((index * 17) % 18) / 100,
      speed: 0.5 + ((index * 19) % 60) / 55,
      phase: randomA * Math.PI * 2,
      depth: 0.55 + ((index * 7) % 40) / 100,
      hue: index % 3 === 0 ? 272 : index % 3 === 1 ? 220 : 198,
    }
  })
}

function resizeCanvas() {
  if (!canvas.value) return
  width = window.innerWidth
  height = window.innerHeight
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.value.width = Math.round(width * pixelRatio)
  canvas.value.height = Math.round(height * pixelRatio)
  canvas.value.style.width = `${width}px`
  canvas.value.style.height = `${height}px`
  context = canvas.value.getContext('2d')
  context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  createStars()
  draw(performance.now())
}

function drawStarField(time: number) {
  if (!context) return
  const animated = shouldAnimate.value && !document.hidden
  pointerX += (targetPointerX - pointerX) * 0.04
  pointerY += (targetPointerY - pointerY) * 0.04

  const seconds = time / 1000
  const profile = getMotionProfile()

  dustParticles.forEach((particle) => {
    const waveX = animated ? Math.sin(seconds * 0.48 + particle.phase) * 22 * particle.depth : 0
    const waveY = animated ? Math.cos(seconds * 0.34 + particle.phase) * 14 * particle.depth : 0
    const driftX = animated ? seconds * profile.dustSpeed * particle.speed * profile.direction : 0
    const driftY = animated ? seconds * profile.dustSpeed * particle.speed * profile.verticalRatio : 0
    const x = (particle.x + driftX + waveX + pointerX * particle.depth * 1.4 + width * 3) % width
    const y = (particle.y + driftY + waveY + pointerY * particle.depth * 1.4 + height * 3) % height
    const pulse = animated ? Math.sin(seconds * 1.45 + particle.phase) * 0.07 : 0
    const opacity = Math.max(0.06, particle.opacity + pulse)
    const gradient = context!.createRadialGradient(x, y, 0, x, y, particle.radius * 3.8)
    gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 91%, ${opacity})`)
    gradient.addColorStop(0.24, `hsla(${particle.hue}, 96%, 76%, ${opacity * 0.58})`)
    gradient.addColorStop(1, `hsla(${particle.hue}, 90%, 68%, 0)`)
    context!.beginPath()
    context!.fillStyle = gradient
    context!.arc(x, y, particle.radius * 3.8, 0, Math.PI * 2)
    context!.fill()
  })

  stars.forEach((star) => {
    const twinkle = animated
      ? Math.sin(seconds * (profile.twinkleSpeed + star.speed * 1.15) + star.phase) * profile.twinkleAmount
      : 0
    const driftX = animated ? seconds * profile.starSpeed * star.speed * profile.direction : 0
    const driftY = animated ? seconds * profile.starSpeed * star.speed * profile.verticalRatio : 0
    const orbitX = animated ? Math.sin(seconds * 0.28 + star.phase) * 8 * star.depth : 0
    const orbitY = animated ? Math.cos(seconds * 0.22 + star.phase) * 5 * star.depth : 0
    const x = (star.x + driftX + orbitX + pointerX * star.depth + width * 2) % width
    const y = (star.y + driftY + orbitY + pointerY * star.depth + height * 2) % height
    const opacity = Math.max(0.12, Math.min(0.96, star.opacity + twinkle))

    if (animated && star.radius > 1.12) {
      const trailLength = profile.starSpeed * star.speed * (0.24 + star.depth * 0.22)
      context!.beginPath()
      context!.strokeStyle = `rgba(151, 179, 255, ${opacity * 0.18})`
      context!.lineWidth = Math.max(0.5, star.radius * 0.42)
      context!.moveTo(x - trailLength * profile.direction, y - trailLength * profile.verticalRatio)
      context!.lineTo(x, y)
      context!.stroke()
    }

    context!.beginPath()
    context!.fillStyle = `rgba(220, 230, 255, ${opacity})`
    context!.arc(x, y, star.radius, 0, Math.PI * 2)
    context!.fill()

    if (star.radius > 1.35) {
      context!.beginPath()
      context!.strokeStyle = `rgba(176, 199, 255, ${opacity * 0.28})`
      context!.moveTo(x - star.radius * 3.6, y)
      context!.lineTo(x + star.radius * 3.6, y)
      context!.moveTo(x, y - star.radius * 3.6)
      context!.lineTo(x, y + star.radius * 3.6)
      context!.stroke()
    }
  })
}

function drawMeteors(time: number) {
  if (!context || !shouldAnimate.value) return

  const kind = currentBackground.value?.kind
  const profile = getMotionProfile()
  const maxMeteors = kind === 'canvas-meteor' ? 3 : 2

  if (time - lastMeteorAt > profile.meteorInterval && meteors.length < maxMeteors) {
    const seed = (Math.sin(time * 0.013) + 1) / 2
    meteors.push({
      startX: width * (0.68 + seed * 0.24),
      startY: height * (0.04 + seed * 0.18),
      length: kind === 'canvas-meteor' ? 185 : kind === 'ambient' ? 92 : 128,
      travel: Math.max(width * 0.46, 560),
      duration: kind === 'canvas-meteor' ? 1050 : kind === 'ambient' ? 1550 : 1300,
      createdAt: time,
      opacity: kind === 'canvas-meteor' ? 0.94 : kind === 'ambient' ? 0.42 : 0.65,
    })
    lastMeteorAt = time
  }

  meteors = meteors.filter((meteor) => time - meteor.createdAt < meteor.duration)
  meteors.forEach((meteor) => {
    const progress = Math.min(1, (time - meteor.createdAt) / meteor.duration)
    const eased = 1 - Math.pow(1 - progress, 2)
    const x = meteor.startX - meteor.travel * eased
    const y = meteor.startY + meteor.travel * 0.5 * eased
    const opacity = Math.sin(progress * Math.PI) * meteor.opacity
    const gradient = context!.createLinearGradient(
      x,
      y,
      x + meteor.length,
      y - meteor.length * 0.54,
    )
    gradient.addColorStop(0, `rgba(235, 242, 255, ${opacity})`)
    gradient.addColorStop(1, 'rgba(145, 175, 255, 0)')
    context!.beginPath()
    context!.strokeStyle = gradient
    context!.lineWidth = kind === 'canvas-meteor' ? 1.8 : 1.35
    context!.moveTo(x, y)
    context!.lineTo(x + meteor.length, y - meteor.length * 0.54)
    context!.stroke()
  })
}

function draw(time: number) {
  if (!context) return
  context.clearRect(0, 0, width, height)
  drawStarField(time)
  drawMeteors(time)
}

function animate(time: number) {
  draw(time)
  if (shouldAnimate.value && !document.hidden) {
    animationFrame = requestAnimationFrame(animate)
  }
}

function restartAnimation() {
  cancelAnimationFrame(animationFrame)
  draw(performance.now())
  if (shouldAnimate.value && !document.hidden) animationFrame = requestAnimationFrame(animate)
}

function handlePointer(event: PointerEvent) {
  targetPointerX = (event.clientX / Math.max(width, 1) - 0.5) * -34
  targetPointerY = (event.clientY / Math.max(height, 1) - 0.5) * -24
}

function handleVisibility() {
  restartAnimation()
}

watch([() => currentBackground.value?.id, shouldAnimate], async () => {
  await nextTick()
  meteors = []
  lastMeteorAt = performance.now() - getMotionProfile().meteorInterval + 900
  resizeCanvas()
  restartAnimation()
})

onMounted(() => {
  lastMeteorAt = performance.now() - getMotionProfile().meteorInterval + 900
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
  <div class="star-background" :class="backgroundClass" aria-hidden="true">
    <canvas ref="canvas" class="star-background__canvas" :data-animated="shouldAnimate"></canvas>
    <div class="star-background__nebula"></div>
    <div class="star-background__vignette"></div>
    <div class="star-background__grain"></div>
  </div>
</template>
