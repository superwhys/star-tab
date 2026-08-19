<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import type { BookmarkNode } from '../types'
import { buildConstellationLayout, type ConstellationNode } from '../utils/constellation'
import {
  createSphereCoordinates,
  driftSpherePoint,
  projectSpherePoint,
  sphereRadius,
  type ProjectedSpherePoint,
  type SphereCamera,
  type SphereViewport,
} from '../utils/constellationSphere'
import FaviconImage from './FaviconImage.vue'
import IconSymbol from './IconSymbol.vue'

const DEFAULT_SPHERE_ZOOM = 1.18

const props = withDefaults(
  defineProps<{
    sections: BookmarkNode[]
    motion?: boolean
  }>(),
  { motion: true },
)

const emit = defineEmits<{
  openFolder: [node: BookmarkNode]
  changeLayout: [layout: 'grid']
}>()

const container = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const zoomPercent = ref(Math.round(DEFAULT_SPHERE_ZOOM * 100))
const dragging = ref(false)
const prefersReducedMotion = ref(false)
const pageHidden = ref(false)
const layout = computed(() => buildConstellationLayout(props.sections))
const sphereCoordinates = computed(() => createSphereCoordinates(layout.value.nodes))
const shouldAutoAnimate = computed(
  () => props.motion && !prefersReducedMotion.value && !pageHidden.value,
)

const camera: SphereCamera = {
  rotationX: -0.18,
  rotationY: -0.34,
  zoom: DEFAULT_SPHERE_ZOOM,
}
const viewport: SphereViewport = { width: 1000, height: 600 }

let targetZoom = DEFAULT_SPHERE_ZOOM
let velocityX = 0
let velocityY = 0
let pointerId: number | undefined
let pointerX = 0
let pointerY = 0
let pointerTime = 0
let frameId: number | undefined
let previousFrameTime = 0
let motionElapsed = 0
let mounted = false
let devicePixelRatio = 1
let resizeObserver: ResizeObserver | undefined
let motionMedia: MediaQueryList | undefined
let nodeElements = new Map<string, HTMLElement>()

function staticNodeStyle(node: ConstellationNode): CSSProperties {
  return {
    '--constellation-node-size': `${node.size}px`,
    '--constellation-node-color': node.color,
    '--constellation-delay': `${node.delay}s`,
  } as CSSProperties
}

function nodeAriaLabel(node: ConstellationNode): string {
  if (node.kind === 'bookmark') return `打开书签 ${node.title}`
  if (node.kind === 'more') return `打开文件夹 ${node.section.title}，查看另外 ${node.hiddenCount} 项`
  return `打开文件夹 ${node.title}`
}

function cacheNodeElements() {
  nodeElements = new Map(
    Array.from(container.value?.querySelectorAll<HTMLElement>('[data-constellation-node-id]') ?? []).map(
      (element) => [element.dataset.constellationNodeId ?? '', element],
    ),
  )
}

function scheduleRender() {
  if (!mounted || frameId !== undefined || typeof window.requestAnimationFrame !== 'function') return
  frameId = window.requestAnimationFrame(renderFrame)
}

function renderFrame(timestamp: number) {
  frameId = undefined
  const delta = previousFrameTime ? Math.min(40, timestamp - previousFrameTime) : 16
  previousFrameTime = timestamp

  if (shouldAutoAnimate.value && !dragging.value) {
    camera.rotationY += delta * 0.0002
    camera.rotationX += Math.sin(timestamp * 0.00031) * delta * 0.000009
    motionElapsed += delta
  }

  const hasInertia = !dragging.value && (Math.abs(velocityX) > 0.00001 || Math.abs(velocityY) > 0.00001)
  if (hasInertia) {
    camera.rotationX = clamp(camera.rotationX + velocityX * delta, -1.35, 1.35)
    camera.rotationY += velocityY * delta
    const decay = Math.pow(0.91, delta / 16)
    velocityX *= decay
    velocityY *= decay
  }

  const zoomDifference = targetZoom - camera.zoom
  const zoomChanging = Math.abs(zoomDifference) > 0.001
  if (zoomChanging) camera.zoom += zoomDifference * (1 - Math.pow(0.82, delta / 16))
  else camera.zoom = targetZoom

  const projectedPoints = projectNodes()
  drawSphere(projectedPoints)

  if (shouldAutoAnimate.value || dragging.value || hasInertia || zoomChanging) scheduleRender()
}

function projectNodes(): Map<string, ProjectedSpherePoint> {
  const projectedPoints = new Map<string, ProjectedSpherePoint>()
  const elapsedSeconds = motionElapsed / 1000

  for (const node of layout.value.nodes) {
    const coordinate = sphereCoordinates.value.get(node.id)
    if (!coordinate) continue
    const point = props.motion && !prefersReducedMotion.value
      ? driftSpherePoint(coordinate, elapsedSeconds)
      : coordinate
    const projected = projectSpherePoint(point, camera, viewport)
    projectedPoints.set(node.id, projected)

    const element = nodeElements.get(node.id)
    if (!element) continue
    element.style.transform = `translate3d(${projected.x}px, ${projected.y}px, 0) translate(-50%, -50%) scale(${projected.scale})`
    element.style.opacity = String(projected.opacity)
    element.style.zIndex = String(Math.round((projected.depth + 1) * 50) + 5)
    element.dataset.sphereSide = projected.depth >= 0 ? 'front' : 'back'
  }

  return projectedPoints
}

function drawSphere(projectedPoints: Map<string, ProjectedSpherePoint>) {
  const context = getCanvasContext()
  if (!context) return

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  context.clearRect(0, 0, viewport.width, viewport.height)
  const centerX = viewport.width * 0.5
  const centerY = viewport.height * 0.5
  const radius = sphereRadius(viewport, camera.zoom)

  const glow = context.createRadialGradient(centerX, centerY, radius * 0.08, centerX, centerY, radius * 1.08)
  glow.addColorStop(0, 'rgba(122, 117, 231, 0.07)')
  glow.addColorStop(0.62, 'rgba(70, 97, 177, 0.025)')
  glow.addColorStop(1, 'rgba(84, 108, 196, 0)')
  context.fillStyle = glow
  context.beginPath()
  context.arc(centerX, centerY, radius * 1.08, 0, Math.PI * 2)
  context.fill()

  drawSphereGuides(context, centerX, centerY, radius)

  const renderedEdges = layout.value.edges
    .map((edge, index) => {
      const from = projectedPoints.get(edge.from)
      const to = projectedPoints.get(edge.to)
      return from && to ? { edge, from, to, index, depth: (from.depth + to.depth) * 0.5 } : undefined
    })
    .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge))
    .sort((left, right) => left.depth - right.depth)

  for (const { edge, from, to, index, depth } of renderedEdges) {
    const depthRatio = (depth + 1) * 0.5
    const alpha = 0.08 + depthRatio * 0.3
    context.strokeStyle = colorWithAlpha(edge.color, alpha)
    context.lineWidth = 0.7 + depthRatio * 1.15
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
    context.stroke()

    if (depthRatio < 0.2) continue
    for (let dotIndex = 0; dotIndex < 3; dotIndex += 1) {
      const flow = ((motionElapsed * 0.00019) + index * 0.137 + dotIndex * 0.31) % 1
      const dotX = from.x + (to.x - from.x) * flow
      const dotY = from.y + (to.y - from.y) * flow
      context.fillStyle = colorWithAlpha(edge.color, 0.34 + depthRatio * 0.5)
      context.beginPath()
      context.arc(dotX, dotY, 0.8 + depthRatio * 1.15, 0, Math.PI * 2)
      context.fill()
    }
  }
}

function drawSphereGuides(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) {
  context.save()
  context.strokeStyle = 'rgba(166, 185, 255, 0.085)'
  context.lineWidth = 0.8
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.stroke()

  context.translate(centerX, centerY)
  context.rotate(camera.rotationY * 0.32)
  context.beginPath()
  context.ellipse(0, 0, radius, radius * 0.27, 0, 0, Math.PI * 2)
  context.stroke()
  context.rotate(-camera.rotationY * 0.32 + camera.rotationX * 0.45)
  context.beginPath()
  context.ellipse(0, 0, radius * 0.3, radius, 0, 0, Math.PI * 2)
  context.stroke()
  context.restore()
}

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (!canvas.value || /jsdom/i.test(navigator.userAgent)) return null
  return canvas.value.getContext('2d')
}

function updateViewport() {
  if (!container.value || !canvas.value) return
  const bounds = container.value.getBoundingClientRect()
  viewport.width = Math.max(1, bounds.width || 1000)
  viewport.height = Math.max(1, bounds.height || 600)
  devicePixelRatio = Math.min(2, window.devicePixelRatio || 1)
  canvas.value.width = Math.round(viewport.width * devicePixelRatio)
  canvas.value.height = Math.round(viewport.height * devicePixelRatio)
  scheduleRender()
}

function handlePointerDown(event: PointerEvent) {
  if (event.button !== 0 || isInteractiveTarget(event.target)) return
  event.preventDefault()
  pointerId = event.pointerId
  pointerX = event.clientX
  pointerY = event.clientY
  pointerTime = performance.now()
  velocityX = 0
  velocityY = 0
  dragging.value = true
  container.value?.setPointerCapture(event.pointerId)
  scheduleRender()
}

function handlePointerMove(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== pointerId) return
  const now = performance.now()
  const deltaTime = Math.max(8, now - pointerTime)
  const deltaX = event.clientX - pointerX
  const deltaY = event.clientY - pointerY
  const sensitivity = 0.0055 / Math.max(0.72, camera.zoom)
  const rotationDeltaX = -deltaY * sensitivity
  const rotationDeltaY = deltaX * sensitivity

  camera.rotationX = clamp(camera.rotationX + rotationDeltaX, -1.35, 1.35)
  camera.rotationY += rotationDeltaY
  velocityX = rotationDeltaX / deltaTime
  velocityY = rotationDeltaY / deltaTime
  pointerX = event.clientX
  pointerY = event.clientY
  pointerTime = now
  scheduleRender()
}

function handlePointerUp(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  dragging.value = false
  pointerId = undefined
  if (container.value?.hasPointerCapture(event.pointerId)) container.value.releasePointerCapture(event.pointerId)
  scheduleRender()
}

function handleWheel(event: WheelEvent) {
  const factor = Math.exp(-event.deltaY * 0.0011)
  setTargetZoom(targetZoom * factor)
}

function adjustZoom(change: number) {
  setTargetZoom(targetZoom + change)
}

function setTargetZoom(value: number) {
  targetZoom = clamp(value, 0.58, 1.75)
  zoomPercent.value = Math.round(targetZoom * 100)
  scheduleRender()
}

function resetView() {
  camera.rotationX = -0.18
  camera.rotationY = -0.34
  velocityX = 0
  velocityY = 0
  setTargetZoom(DEFAULT_SPHERE_ZOOM)
}

function handleDoubleClick(event: MouseEvent) {
  if (!isInteractiveTarget(event.target)) resetView()
}

function handleKeydown(event: KeyboardEvent) {
  const step = 0.12
  if (event.key === 'ArrowLeft') camera.rotationY -= step
  else if (event.key === 'ArrowRight') camera.rotationY += step
  else if (event.key === 'ArrowUp') camera.rotationX = clamp(camera.rotationX - step, -1.35, 1.35)
  else if (event.key === 'ArrowDown') camera.rotationX = clamp(camera.rotationX + step, -1.35, 1.35)
  else if (event.key === '+' || event.key === '=') adjustZoom(0.12)
  else if (event.key === '-' || event.key === '_') adjustZoom(-0.12)
  else if (event.key === '0') resetView()
  else return
  event.preventDefault()
  scheduleRender()
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('.constellation-node, .constellation-controls'))
}

function updateMotionPreference(event?: MediaQueryListEvent) {
  prefersReducedMotion.value = event?.matches ?? motionMedia?.matches ?? false
  scheduleRender()
}

function handleVisibilityChange() {
  pageHidden.value = document.hidden
  if (pageHidden.value) {
    velocityX = 0
    velocityY = 0
    dragging.value = false
    pointerId = undefined
  }
  previousFrameTime = 0
  scheduleRender()
}

function colorWithAlpha(color: string, alpha: number): string {
  const normalized = color.replace('#', '')
  const value = Number.parseInt(normalized, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

watch(layout, async () => {
  await nextTick()
  cacheNodeElements()
  scheduleRender()
})
watch(shouldAutoAnimate, () => scheduleRender())

onMounted(async () => {
  mounted = true
  pageHidden.value = document.hidden
  motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotionPreference()
  motionMedia.addEventListener('change', updateMotionPreference)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  await nextTick()
  cacheNodeElements()
  updateViewport()
  if (typeof ResizeObserver !== 'undefined' && container.value) {
    resizeObserver = new ResizeObserver(updateViewport)
    resizeObserver.observe(container.value)
  }
  scheduleRender()
})

onBeforeUnmount(() => {
  mounted = false
  if (frameId !== undefined) window.cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()
  motionMedia?.removeEventListener('change', updateMotionPreference)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <section
    ref="container"
    class="bookmark-constellation bookmark-constellation--sphere"
    :class="{ 'bookmark-constellation--dragging': dragging }"
    tabindex="0"
    aria-label="可旋转和缩放的书签星球"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @wheel.prevent="handleWheel"
    @dblclick="handleDoubleClick"
    @keydown="handleKeydown"
  >
    <canvas ref="canvas" class="constellation-canvas" aria-hidden="true"></canvas>

    <template v-for="node in layout.nodes" :key="node.id">
      <a
        v-if="node.kind === 'bookmark'"
        class="constellation-node constellation-node--bookmark"
        :data-depth="node.depth"
        :data-constellation-node-id="node.id"
        :style="staticNodeStyle(node)"
        :href="node.url"
        :aria-label="nodeAriaLabel(node)"
      >
        <span class="constellation-node__halo" aria-hidden="true"></span>
        <span class="constellation-node__orb">
          <FaviconImage :title="node.title" :url="node.url" :size="Math.max(18, node.size - 9)" subtle />
        </span>
        <span class="constellation-node__label" :title="node.title">{{ node.title }}</span>
      </a>

      <button
        v-else
        type="button"
        class="constellation-node"
        :class="`constellation-node--${node.kind}`"
        :data-depth="node.depth"
        :data-constellation-node-id="node.id"
        :style="staticNodeStyle(node)"
        :aria-label="nodeAriaLabel(node)"
        @click="emit('openFolder', node.node)"
      >
        <span class="constellation-node__halo" aria-hidden="true"></span>
        <span class="constellation-node__orb">
          <span v-if="node.kind === 'more'" class="constellation-node__more">+{{ node.hiddenCount }}</span>
          <IconSymbol v-else name="folder" :size="node.kind === 'section' ? 20 : 15" />
        </span>
        <span class="constellation-node__label" :title="node.title">{{ node.title }}</span>
      </button>
    </template>

    <div class="constellation-controls" aria-label="星球视图控制">
      <button type="button" aria-label="缩小星图" title="缩小" @click="adjustZoom(-0.12)">−</button>
      <output aria-live="polite">{{ zoomPercent }}%</output>
      <button type="button" aria-label="放大星图" title="放大" @click="adjustZoom(0.12)">+</button>
      <button type="button" class="constellation-controls__reset" aria-label="重置星图视角" title="重置视角" @click="resetView">◎</button>
      <button
        type="button"
        class="constellation-controls__layout"
        aria-label="切换到普通宫格布局"
        title="切换到普通宫格"
        @click="emit('changeLayout', 'grid')"
      >
        <span aria-hidden="true">▦</span>
        宫格
      </button>
    </div>

    <p class="constellation-hint">
      <span></span>
      拖拽旋转 · 滚轮缩放 · 双击复位
    </p>
  </section>
</template>
