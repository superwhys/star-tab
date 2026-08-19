import { onBeforeUnmount, watch, type Ref } from 'vue'

/** 指针在视口中的位置。 */
export type DockPointer = {
  x: number
  y: number
}

/** 用于计算程序坞放大的书签图标几何信息。 */
export type DockTileTarget = {
  tile: HTMLElement
  x: number
  y: number
  size: number
}

const ICON_SELECTOR = ':scope > .favicon, :scope > .folder-preview'
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const ROW_BUCKET = 12

export const DOCK_MAX_SCALE = 1.48
export const DOCK_RANGE_X_RATIO = 2.55
export const DOCK_RANGE_Y_RATIO = 0.92
export const DOCK_LIFT_RATIO = 26
export const DOCK_LIVE_CLASS = 'bookmark-grid--dock-live'
export const DOCK_SETTLING_CLASS = 'bookmark-grid--dock-settling'
export const DOCK_TRACKING_CLASS = 'bookmark-grid--dock-tracking'

/**
 * 计算程序坞式衰减系数，中心为 1、范围外为 0。
 */
export function computeDockFalloff(distance: number, range: number): number {
  if (range <= 0 || distance >= range) return 0
  return Math.cos((distance / range) * (Math.PI / 2))
}

/**
 * 按与指针的距离计算程序坞式放大倍率。
 */
export function computeDockScale(distance: number, range: number, maxScale = DOCK_MAX_SCALE): number {
  return 1 + (maxScale - 1) * computeDockFalloff(distance, range)
}

/**
 * 读取网格中每个书签图标的未缩放中心点。
 */
export function readDockTileMetrics(grid: HTMLElement): DockTileTarget[] {
  return Array.from(grid.querySelectorAll<HTMLElement>(':scope > .bookmark-tile'), (tile) => {
    const icon = tile.querySelector<HTMLElement>(ICON_SELECTOR)
    const tileRect = tile.getBoundingClientRect()
    if (!icon) {
      return {
        tile,
        x: tileRect.left + tileRect.width / 2,
        y: tileRect.top + tileRect.height / 2,
        size: 64,
      }
    }

    return {
      tile,
      x: tileRect.left + icon.offsetLeft + icon.offsetWidth / 2,
      y: tileRect.top + icon.offsetTop + icon.offsetHeight / 2,
      size: icon.offsetWidth || 64,
    }
  })
}

/**
 * 把同一行的图标按从左到右分组，便于横向推开邻居。
 */
export function groupDockTilesByRow(targets: DockTileTarget[]): DockTileTarget[][] {
  const rows = new Map<number, DockTileTarget[]>()
  for (const target of targets) {
    const key = Math.round(target.y / ROW_BUCKET)
    const row = rows.get(key)
    if (row) row.push(target)
    else rows.set(key, [target])
  }
  return Array.from(rows.values(), (row) => row.sort((left, right) => left.x - right.x))
}

/**
 * 根据放大后多出的宽度，把同一行图标从指针处向两侧推开。
 */
export function computeDockRowShifts(row: DockTileTarget[], scales: number[]): number[] {
  const extras = row.map((target, index) => (scales[index] - 1) * target.size)
  return row.map((_, index) => {
    let left = 0
    let right = 0
    for (let cursor = 0; cursor < index; cursor += 1) left += extras[cursor]
    for (let cursor = index + 1; cursor < extras.length; cursor += 1) right += extras[cursor]
    return (left - right) / 2
  })
}

function writeDockStyle(tile: HTMLElement, scale: number, shift: number, lift: number, maxScale: number) {
  const emphasis = Math.max(0, (scale - 1) / (maxScale - 1))
  tile.style.setProperty('--dock-scale', scale.toFixed(4))
  tile.style.setProperty('--dock-shift', `${shift.toFixed(2)}px`)
  tile.style.setProperty('--dock-lift', `${lift.toFixed(2)}px`)
  tile.style.setProperty('--dock-z', String(Math.round(scale * 100)))
  tile.style.setProperty('--dock-emphasis', emphasis.toFixed(3))
  tile.classList.toggle('bookmark-tile--magnified', scale > 1.045)
}

/**
 * 根据指针位置把放大倍率与位移写到每个书签节点上。
 */
export function applyDockMagnify(
  targets: DockTileTarget[],
  pointer: DockPointer | null,
  options: { maxScale?: number; rangeXRatio?: number; rangeYRatio?: number; liftRatio?: number } = {},
): void {
  const maxScale = options.maxScale ?? DOCK_MAX_SCALE
  const rangeXRatio = options.rangeXRatio ?? DOCK_RANGE_X_RATIO
  const rangeYRatio = options.rangeYRatio ?? DOCK_RANGE_Y_RATIO
  const liftRatio = options.liftRatio ?? DOCK_LIFT_RATIO

  if (!pointer) {
    for (const target of targets) writeDockStyle(target.tile, 1, 0, 0, maxScale)
    return
  }

  const scales = targets.map((target) => {
    const rangeX = Math.max(target.size * rangeXRatio, 1)
    const rangeY = Math.max(target.size * rangeYRatio, 1)
    return (
      1 +
      (maxScale - 1) *
        computeDockFalloff(Math.abs(pointer.x - target.x), rangeX) *
        computeDockFalloff(Math.abs(pointer.y - target.y), rangeY)
    )
  })

  const scaleByTile = new Map(targets.map((target, index) => [target.tile, scales[index]]))
  const shiftByTile = new Map<HTMLElement, number>()
  for (const row of groupDockTilesByRow(targets)) {
    const rowScales = row.map((target) => scaleByTile.get(target.tile) ?? 1)
    const shifts = computeDockRowShifts(row, rowScales)
    row.forEach((target, index) => shiftByTile.set(target.tile, shifts[index]))
  }

  targets.forEach((target, index) => {
    const scale = scales[index]
    writeDockStyle(
      target.tile,
      scale,
      shiftByTile.get(target.tile) ?? 0,
      -((scale - 1) * liftRatio),
      maxScale,
    )
  })
}

/**
 * 判断当前环境是否适合启用连续的程序坞放大。
 */
export function canUseDockMagnify(): boolean {
  return window.matchMedia(FINE_POINTER_QUERY).matches && !window.matchMedia(REDUCE_MOTION_QUERY).matches
}

/**
 * 在书签网格上跟踪指针，让靠近鼠标的图标像程序坞一样放大。
 */
export function useDockMagnify(gridRef: Ref<HTMLElement | null>) {
  let frame = 0
  let settleTimer = 0
  let grid: HTMLElement | null = null
  let live = false
  const mediaQueries = [FINE_POINTER_QUERY, REDUCE_MOTION_QUERY].map((query) => window.matchMedia(query))

  function cancelFrame() {
    if (!frame) return
    cancelAnimationFrame(frame)
    frame = 0
  }

  function setSettling(enabled: boolean) {
    if (!grid) return
    grid.classList.toggle(DOCK_SETTLING_CLASS, enabled)
    window.clearTimeout(settleTimer)
    if (enabled) {
      settleTimer = window.setTimeout(() => grid?.classList.remove(DOCK_SETTLING_CLASS, DOCK_TRACKING_CLASS), 340)
    }
  }

  function resetMagnify() {
    if (!grid) return
    setSettling(true)
    applyDockMagnify(readDockTileMetrics(grid), null)
  }

  function updateLiveState() {
    const nextLive = canUseDockMagnify()
    if (nextLive === live) return
    live = nextLive
    grid?.classList.toggle(DOCK_LIVE_CLASS, live)
    if (!live) resetMagnify()
  }

  function onPointerMove(event: PointerEvent) {
    if (!live || !grid || event.pointerType === 'touch') return
    const point = { x: event.clientX, y: event.clientY }
    cancelFrame()
    frame = requestAnimationFrame(() => {
      frame = 0
      if (!grid) return
      grid.classList.add(DOCK_TRACKING_CLASS)
      grid.classList.remove(DOCK_SETTLING_CLASS)
      applyDockMagnify(readDockTileMetrics(grid), point)
    })
  }

  function onPointerLeave() {
    if (!live) return
    cancelFrame()
    resetMagnify()
  }

  function bind(nextGrid: HTMLElement) {
    grid = nextGrid
    live = canUseDockMagnify()
    grid.classList.toggle(DOCK_LIVE_CLASS, live)
    grid.addEventListener('pointerenter', onPointerMove)
    grid.addEventListener('pointermove', onPointerMove)
    grid.addEventListener('pointerleave', onPointerLeave)
    grid.addEventListener('pointercancel', onPointerLeave)
  }

  function unbind() {
    cancelFrame()
    window.clearTimeout(settleTimer)
    if (!grid) return
    grid.removeEventListener('pointerenter', onPointerMove)
    grid.removeEventListener('pointermove', onPointerMove)
    grid.removeEventListener('pointerleave', onPointerLeave)
    grid.removeEventListener('pointercancel', onPointerLeave)
    grid.classList.remove(DOCK_LIVE_CLASS, DOCK_SETTLING_CLASS, DOCK_TRACKING_CLASS)
    applyDockMagnify(readDockTileMetrics(grid), null)
    grid = null
    live = false
  }

  watch(
    gridRef,
    (nextGrid, previousGrid) => {
      if (previousGrid) unbind()
      if (nextGrid) bind(nextGrid)
    },
    { flush: 'post', immediate: true },
  )

  for (const media of mediaQueries) media.addEventListener('change', updateLiveState)
  onBeforeUnmount(() => {
    for (const media of mediaQueries) media.removeEventListener('change', updateLiveState)
    unbind()
  })
}
