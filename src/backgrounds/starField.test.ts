import { describe, expect, it } from 'vitest'
import { BACKGROUND_MOTION_PROFILES } from './motionProfiles'
import { createStarField, projectStar, smoothNoise } from './starField'

const width = 1440
const height = 900
const field = (id: string) => createStarField(width, height, BACKGROUND_MOTION_PROFILES[id])

describe('star field scenes', () => {
  it('recreates a stable sky for each preset', () => {
    for (const id of Object.keys(BACKGROUND_MOTION_PROFILES)) {
      expect(field(id)).toEqual(field(id))
    }
  })

  it('gives the presets different spatial compositions and densities', () => {
    const river = field('stellar-drift')
    const open = field('meteor-night')
    const mist = field('lunar-mist')
    const cloud = field('indigo-nebula')
    const horizon = field('blue-horizon')
    const inRiver = (star: { x: number; y: number }) => Math.abs(star.y / height - (0.91 - star.x / width * 0.82)) < 0.1

    expect(river.filter(inRiver).length / river.length).toBeGreaterThan(0.65)
    expect(open.filter(inRiver).length / open.length).toBeLessThan(0.35)
    expect(mist.length).toBeLessThan(open.length)
    expect(horizon.filter((star) => star.y > height * 0.65).length / horizon.length).toBeGreaterThan(0.7)
    const inCloud = cloud.filter((star) => Math.min(
      Math.hypot(star.x / width - 0.25, star.y / height - 0.3),
      Math.hypot(star.x / width - 0.77, star.y / height - 0.66),
    ) < 0.22)
    expect(inCloud.length / cloud.length).toBeGreaterThan(0.7)
  })

  it('keeps polar stars on circular paths and reverse drift within the padded canvas after a day', () => {
    const orbit = BACKGROUND_MOTION_PROFILES['violet-orbit']
    const star = field('violet-orbit')[20]
    const before = projectStar(star, 0, width, height, orbit)
    const after = projectStar(star, 120, width, height, orbit)
    const distance = (point: { x: number; y: number }) => Math.hypot(point.x - width * 0.72, point.y - height * 0.24)
    expect(distance(after)).toBeCloseTo(distance(before), 8)
    expect(after).not.toEqual(before)

    const reverse = BACKGROUND_MOTION_PROFILES['meteor-night']
    for (const point of field('meteor-night')) {
      const moved = projectStar(point, 86_400, width, height, reverse)
      expect(moved.x).toBeGreaterThanOrEqual(-16)
      expect(moved.x).toBeLessThan(width + 16)
      expect(moved.y).toBeGreaterThanOrEqual(-16)
      expect(moved.y).toBeLessThan(height + 16)
    }
  })

  it('keeps the irregular twinkle continuous at noise boundaries', () => {
    for (let step = 1; step < 20; step += 1) {
      expect(smoothNoise(step - 0.00001, 41)).toBeCloseTo(smoothNoise(step + 0.00001, 41), 6)
    }
  })
})
