import type { MotionProfile } from './motionProfiles'

export interface Star {
  x: number
  y: number
  radius: number
  opacity: number
  depth: number
  phase: number
  twinkleRate: number
  twinkleStrength: number
  color: string
}

// 固定种子让窗口重绘与静态预览保持同一片星空。
export function random(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

export function smoothNoise(time: number, seed: number) {
  const step = Math.floor(time)
  const fraction = time - step
  const blend = fraction * fraction * (3 - 2 * fraction)
  const from = random(seed + step)
  return (from + (random(seed + step + 1) - from) * blend) * 2 - 1
}

export function createStarField(width: number, height: number, profile: MotionProfile): Star[] {
  const baseCount = Math.min(720, Math.max(170, Math.round((width * height) / 2700)))
  const orbitRadius = Math.hypot(width * 0.72, height * 0.76)
  // 星轨覆盖整个外接圆，旋转后屏幕边缘也不会露出空缺。
  const coverage = profile.distribution === 'orbit'
    ? Math.PI * orbitRadius ** 2 / Math.max(width * height, 1)
    : 1
  const count = Math.min(2400, Math.round(baseCount * profile.density * coverage))

  return Array.from({ length: count }, (_, index) => {
    const seed = index * 17 + profile.seed * 101
    const magnitude = Math.pow(random(seed + 3), 2)
    const tint = random(seed + 9)
    const clustered = random(seed + 10)
    const spread = (random(seed + 11) + random(seed + 12) + random(seed + 13) - 1.5) / 1.5
    let x = random(seed + 1)
    let y = random(seed + 2)

    switch (profile.distribution) {
      case 'river':
        if (clustered < 0.74) y = 0.91 - x * 0.82 + Math.sin(x * 5) * 0.025 + spread * 0.17
        break
      case 'cloud':
        if (clustered < 0.8) {
          const lobe = random(seed + 14) < 0.58
          x = (lobe ? 0.25 : 0.77) + spread * 0.28
          y = (lobe ? 0.3 : 0.66) + (y - 0.5) * 0.34 + spread * 0.16
        }
        break
      case 'orbit': {
        const radius = Math.sqrt(x) * orbitRadius
        const angle = y * Math.PI * 2
        x = 0.72 + Math.cos(angle) * radius / Math.max(width, 1)
        y = 0.24 + Math.sin(angle) * radius / Math.max(height, 1)
        break
      }
      case 'mist':
        y *= 0.78
        break
      case 'horizon':
        if (clustered < 0.74) y = 0.77 + (x - 0.5) ** 2 * 0.48 + spread * 0.065
        break
    }

    const soft = profile.distribution === 'cloud' && clustered < 0.8
    return {
      x: x * width,
      y: y * height,
      radius: (0.45 + magnitude * 1.05) * (soft ? 0.72 : 1),
      opacity: (0.3 + magnitude * 0.62) * (soft ? 0.85 : 1),
      depth: 0.2 + magnitude * 0.65,
      phase: random(seed + 4) * 100,
      twinkleRate: 0.55 + random(seed + 5) * 1.3,
      twinkleStrength: 0.4 + random(seed + 6) * 0.6,
      color: tint < 0.12 ? '255, 231, 207' : tint > 0.82 ? '199, 222, 255' : '230, 237, 248',
    }
  })
}

function wrap(position: number, size: number) {
  const span = size + 32
  return ((position + 16) % span + span) % span - 16
}

export function projectStar(star: Star, seconds: number, width: number, height: number, profile: MotionProfile) {
  if (profile.distribution === 'orbit') {
    const angle = seconds * profile.starSpeed / Math.max(width, height, 1)
    const x = star.x - width * 0.72
    const y = star.y - height * 0.24
    return {
      x: width * 0.72 + x * Math.cos(angle) - y * Math.sin(angle),
      y: height * 0.24 + x * Math.sin(angle) + y * Math.cos(angle),
    }
  }

  const drift = seconds * profile.starSpeed * (0.55 + star.depth)
  return {
    x: wrap(star.x + drift * profile.direction, width),
    y: wrap(star.y + drift * profile.verticalRatio, height),
  }
}
