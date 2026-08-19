import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyDockMagnify,
  canUseDockMagnify,
  computeDockFalloff,
  computeDockRowShifts,
  computeDockScale,
  DOCK_LIVE_CLASS,
  DOCK_MAX_SCALE,
  readDockTileMetrics,
  useDockMagnify,
} from './useDockMagnify'

function createTile(x: number, y: number, size = 64) {
  const tile = document.createElement('button')
  tile.className = 'bookmark-tile'
  const icon = document.createElement('span')
  icon.className = 'favicon'
  tile.append(icon)
  document.body.append(tile)

  Object.defineProperty(tile, 'getBoundingClientRect', {
    value: () => ({
      x,
      y,
      left: x,
      top: y,
      right: x + 100,
      bottom: y + 90,
      width: 100,
      height: 90,
      toJSON() {},
    }),
  })
  Object.defineProperty(icon, 'offsetLeft', { value: 18 })
  Object.defineProperty(icon, 'offsetTop', { value: 7 })
  Object.defineProperty(icon, 'offsetWidth', { value: size })
  Object.defineProperty(icon, 'offsetHeight', { value: size })
  return tile
}

describe('computeDockScale', () => {
  it('reaches the maximum scale at the pointer', () => {
    expect(computeDockScale(0, 180)).toBeCloseTo(DOCK_MAX_SCALE)
    expect(computeDockFalloff(0, 180)).toBeCloseTo(1)
  })

  it('returns the resting scale outside the magnification range', () => {
    expect(computeDockScale(180, 180)).toBe(1)
    expect(computeDockScale(240, 180)).toBe(1)
  })

  it('falls off smoothly for neighboring icons', () => {
    const neighbor = computeDockScale(90, 180)
    expect(neighbor).toBeGreaterThan(1)
    expect(neighbor).toBeLessThan(DOCK_MAX_SCALE)
  })
})

describe('computeDockRowShifts', () => {
  it('opens space around the magnified icon', () => {
    const row = [
      { tile: document.createElement('button'), x: 0, y: 0, size: 64 },
      { tile: document.createElement('button'), x: 120, y: 0, size: 64 },
      { tile: document.createElement('button'), x: 240, y: 0, size: 64 },
    ]
    const shifts = computeDockRowShifts(row, [1, 1.5, 1])
    expect(shifts[0]).toBeLessThan(0)
    expect(shifts[1]).toBe(0)
    expect(shifts[2]).toBeGreaterThan(0)
    expect(shifts[2]).toBeCloseTo(-shifts[0])
  })
})

describe('applyDockMagnify', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('magnifies the nearest tile and eases neighbors', () => {
    const near = createTile(0, 0)
    const far = createTile(400, 0)
    const targets = [
      { tile: near, x: 50, y: 39, size: 64 },
      { tile: far, x: 450, y: 39, size: 64 },
    ]

    applyDockMagnify(targets, { x: 50, y: 39 })

    expect(Number(near.style.getPropertyValue('--dock-scale'))).toBeCloseTo(DOCK_MAX_SCALE, 2)
    expect(near.classList.contains('bookmark-tile--magnified')).toBe(true)
    expect(Number(far.style.getPropertyValue('--dock-scale'))).toBe(1)
    expect(far.classList.contains('bookmark-tile--magnified')).toBe(false)
  })

  it('pushes same-row neighbors aside as the icon grows', () => {
    const left = createTile(0, 0)
    const right = createTile(120, 0)
    const targets = [
      { tile: left, x: 50, y: 39, size: 64 },
      { tile: right, x: 170, y: 39, size: 64 },
    ]

    applyDockMagnify(targets, { x: 50, y: 39 })

    expect(parseFloat(left.style.getPropertyValue('--dock-shift'))).toBeLessThan(0)
    expect(parseFloat(right.style.getPropertyValue('--dock-shift'))).toBeGreaterThan(0)
    expect(Number(right.style.getPropertyValue('--dock-scale'))).toBeGreaterThan(1)
  })

  it('keeps a distant row from growing with the hovered row', () => {
    const hovered = createTile(0, 0)
    const below = createTile(0, 180)
    const targets = [
      { tile: hovered, x: 50, y: 39, size: 64 },
      { tile: below, x: 50, y: 219, size: 64 },
    ]

    applyDockMagnify(targets, { x: 50, y: 39 })

    expect(Number(hovered.style.getPropertyValue('--dock-scale'))).toBeCloseTo(DOCK_MAX_SCALE, 2)
    expect(Number(below.style.getPropertyValue('--dock-scale'))).toBe(1)
  })

  it('resets every tile when the pointer leaves', () => {
    const tile = createTile(0, 0)
    const targets = [{ tile, x: 50, y: 39, size: 64 }]
    applyDockMagnify(targets, { x: 50, y: 39 })
    applyDockMagnify(targets, null)

    expect(tile.style.getPropertyValue('--dock-scale')).toBe('1.0000')
    expect(tile.style.getPropertyValue('--dock-shift')).toBe('0.00px')
    expect(tile.classList.contains('bookmark-tile--magnified')).toBe(false)
  })
})

describe('readDockTileMetrics', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('uses the unscaled icon center inside each tile', () => {
    const grid = document.createElement('div')
    grid.className = 'bookmark-grid'
    const tile = createTile(20, 40)
    grid.append(tile)
    document.body.append(grid)

    expect(readDockTileMetrics(grid)).toEqual([
      { tile, x: 20 + 18 + 32, y: 40 + 7 + 32, size: 64 },
    ])
  })
})

describe('useDockMagnify', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('enables live magnification for a fine pointer', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('hover: hover'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })

    expect(canUseDockMagnify()).toBe(true)

    const Host = defineComponent({
      setup() {
        const gridRef = ref<HTMLElement | null>(null)
        useDockMagnify(gridRef)
        return { gridRef }
      },
      template: '<div ref="gridRef" class="bookmark-grid"><button class="bookmark-tile"><span class="favicon"></span></button></div>',
    })

    const wrapper = mount(Host, { attachTo: document.body })
    await nextTick()

    const grid = wrapper.get('.bookmark-grid').element
    const tile = wrapper.get('.bookmark-tile').element as HTMLElement
    const icon = wrapper.get('.favicon').element as HTMLElement
    Object.defineProperty(tile, 'getBoundingClientRect', {
      value: () => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 100,
        bottom: 90,
        width: 100,
        height: 90,
        toJSON() {},
      }),
    })
    Object.defineProperty(icon, 'offsetLeft', { value: 18 })
    Object.defineProperty(icon, 'offsetTop', { value: 7 })
    Object.defineProperty(icon, 'offsetWidth', { value: 64 })
    Object.defineProperty(icon, 'offsetHeight', { value: 64 })

    expect(grid.classList.contains(DOCK_LIVE_CLASS)).toBe(true)

    const move = new MouseEvent('pointermove', { clientX: 50, clientY: 39, bubbles: true })
    Object.defineProperty(move, 'pointerType', { value: 'mouse' })
    grid.dispatchEvent(move)
    expect(Number(tile.style.getPropertyValue('--dock-scale'))).toBeGreaterThan(1.2)

    wrapper.unmount()
  })
})
