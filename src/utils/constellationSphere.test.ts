import { describe, expect, it } from 'vitest'
import type { ConstellationNode } from './constellation'
import {
  createSphereCoordinates,
  driftSpherePoint,
  projectSpherePoint,
  rotateSpherePoint,
} from './constellationSphere'

const nodes = [
  { id: 'root', kind: 'section' },
  { id: 'one', kind: 'bookmark' },
  { id: 'two', kind: 'folder' },
  { id: 'three', kind: 'bookmark' },
] as ConstellationNode[]

describe('constellation sphere math', () => {
  it('places nodes deterministically on a unit sphere', () => {
    const first = createSphereCoordinates(nodes)
    const second = createSphereCoordinates(nodes)

    expect(first).toEqual(second)
    expect(first.get('root')).toMatchObject({ x: 0, y: 0, z: 1 })
    for (const coordinate of first.values()) {
      expect(Math.hypot(coordinate.x, coordinate.y, coordinate.z)).toBeCloseTo(1, 6)
    }
  })

  it('moves every node without letting it leave the sphere surface', () => {
    const coordinate = createSphereCoordinates(nodes).get('one')!
    const moved = driftSpherePoint(coordinate, 4)

    expect(moved).not.toEqual({ x: coordinate.x, y: coordinate.y, z: coordinate.z })
    expect(Math.hypot(moved.x, moved.y, moved.z)).toBeCloseTo(1, 6)
  })

  it('rotates, projects depth and applies zoom', () => {
    const rotated = rotateSpherePoint({ x: 0, y: 0, z: 1 }, 0, Math.PI / 2)
    expect(rotated.x).toBeCloseTo(1, 6)

    const viewport = { width: 800, height: 600 }
    const front = projectSpherePoint({ x: 0, y: 0, z: 1 }, { rotationX: 0, rotationY: 0, zoom: 1 }, viewport)
    const back = projectSpherePoint({ x: 0, y: 0, z: -1 }, { rotationX: 0, rotationY: 0, zoom: 1 }, viewport)
    const normal = projectSpherePoint({ x: 1, y: 0, z: 0 }, { rotationX: 0, rotationY: 0, zoom: 1 }, viewport)
    const zoomed = projectSpherePoint({ x: 1, y: 0, z: 0 }, { rotationX: 0, rotationY: 0, zoom: 1.5 }, viewport)

    expect(front.scale).toBeGreaterThan(back.scale)
    expect(front.opacity).toBeGreaterThan(back.opacity)
    expect(zoomed.x - viewport.width / 2).toBeCloseTo((normal.x - viewport.width / 2) * 1.5, 6)
  })
})
