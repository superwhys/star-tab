import type { ConstellationNode } from './constellation'

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface SphereCoordinate extends Vector3 {
  phase: number
  driftSpeed: number
  driftAmplitude: number
}

export interface SphereCamera {
  rotationX: number
  rotationY: number
  zoom: number
}

export interface SphereViewport {
  width: number
  height: number
}

export interface ProjectedSpherePoint {
  x: number
  y: number
  depth: number
  scale: number
  opacity: number
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export function createSphereCoordinates(nodes: ConstellationNode[]): Map<string, SphereCoordinate> {
  const coordinates = new Map<string, SphereCoordinate>()
  if (!nodes.length) return coordinates

  nodes.forEach((node, index) => {
    const phase = hashUnit(node.id) * Math.PI * 2
    let point: Vector3

    if (index === 0 && node.kind === 'section') {
      point = { x: 0, y: 0, z: 1 }
    } else {
      const distributedIndex = index === 0 ? 0 : index - 1
      const distributedCount = Math.max(1, nodes.length - 1)
      const y = 1 - ((distributedIndex + 0.5) / distributedCount) * 2
      const horizontalRadius = Math.sqrt(Math.max(0, 1 - y * y))
      const angle = distributedIndex * GOLDEN_ANGLE + phase * 0.13
      point = {
        x: Math.cos(angle) * horizontalRadius,
        y,
        z: Math.sin(angle) * horizontalRadius,
      }
    }

    coordinates.set(node.id, {
      ...normalizeVector(point),
      phase,
      driftSpeed: 0.24 + hashUnit(`${node.id}:speed`) * 0.22,
      driftAmplitude: node.kind === 'section' ? 0.012 : 0.022 + hashUnit(`${node.id}:drift`) * 0.016,
    })
  })

  return coordinates
}

export function driftSpherePoint(coordinate: SphereCoordinate, elapsedSeconds: number): Vector3 {
  const wave = elapsedSeconds * coordinate.driftSpeed
  const amplitude = coordinate.driftAmplitude
  return normalizeVector({
    x: coordinate.x + Math.sin(wave + coordinate.phase) * amplitude,
    y: coordinate.y + Math.cos(wave * 0.83 + coordinate.phase * 1.3) * amplitude,
    z: coordinate.z + Math.sin(wave * 0.67 - coordinate.phase * 0.7) * amplitude,
  })
}

export function rotateSpherePoint(point: Vector3, rotationX: number, rotationY: number): Vector3 {
  const cosY = Math.cos(rotationY)
  const sinY = Math.sin(rotationY)
  const xAfterY = point.x * cosY + point.z * sinY
  const zAfterY = -point.x * sinY + point.z * cosY

  const cosX = Math.cos(rotationX)
  const sinX = Math.sin(rotationX)
  return {
    x: xAfterY,
    y: point.y * cosX - zAfterY * sinX,
    z: point.y * sinX + zAfterY * cosX,
  }
}

export function projectSpherePoint(
  point: Vector3,
  camera: SphereCamera,
  viewport: SphereViewport,
): ProjectedSpherePoint {
  const rotated = rotateSpherePoint(point, camera.rotationX, camera.rotationY)
  const radius = Math.min(viewport.width, viewport.height) * 0.355 * camera.zoom
  const depthRatio = (rotated.z + 1) * 0.5
  const perspective = 0.9 + depthRatio * 0.2

  return {
    x: viewport.width * 0.5 + rotated.x * radius * perspective,
    y: viewport.height * 0.5 + rotated.y * radius * perspective,
    depth: rotated.z,
    scale: 0.62 + depthRatio * 0.62,
    opacity: 0.32 + depthRatio * 0.68,
  }
}

export function sphereRadius(viewport: SphereViewport, zoom: number): number {
  return Math.min(viewport.width, viewport.height) * 0.355 * zoom
}

export function cameraRotationForPoint(
  point: Vector3,
  currentRotationY = 0,
): Pick<SphereCamera, 'rotationX' | 'rotationY'> {
  const rotationY = nearestEquivalentAngle(Math.atan2(-point.x, point.z), currentRotationY)
  return {
    rotationX: Math.atan2(point.y, Math.hypot(point.x, point.z)),
    rotationY,
  }
}

export function nearestEquivalentAngle(angle: number, reference: number): number {
  const fullTurn = Math.PI * 2
  return angle + Math.round((reference - angle) / fullTurn) * fullTurn
}

function normalizeVector(vector: Vector3): Vector3 {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

function hashUnit(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}
