export type StarDistribution = 'river' | 'open' | 'cloud' | 'orbit' | 'mist' | 'horizon'

export interface MotionProfile {
  distribution: StarDistribution
  seed: number
  density: number
  starSpeed: number
  verticalRatio: number
  direction: 1 | -1
  twinkleSpeed: number
  twinkleAmount: number
  meteorInterval: number
}

export const BACKGROUND_MOTION_PROFILES: Record<string, MotionProfile> = {
  'stellar-drift': {
    distribution: 'river',
    seed: 11,
    density: 1.7,
    starSpeed: 2.4,
    verticalRatio: -0.55,
    direction: 1,
    twinkleSpeed: 0.85,
    twinkleAmount: 0.65,
    meteorInterval: 18000,
  },
  'meteor-night': {
    distribution: 'open',
    seed: 97,
    density: 0.55,
    starSpeed: 0.45,
    verticalRatio: 0.12,
    direction: -1,
    twinkleSpeed: 1.1,
    twinkleAmount: 0.7,
    meteorInterval: 2800,
  },
  'indigo-nebula': {
    distribution: 'cloud',
    seed: 211,
    density: 1.6,
    starSpeed: 0.8,
    verticalRatio: -0.2,
    direction: 1,
    twinkleSpeed: 0.45,
    twinkleAmount: 0.5,
    meteorInterval: 0,
  },
  'violet-orbit': {
    distribution: 'orbit',
    seed: 307,
    density: 0.8,
    starSpeed: 7,
    verticalRatio: 0,
    direction: 1,
    twinkleSpeed: 0.35,
    twinkleAmount: 0.25,
    meteorInterval: 0,
  },
  'lunar-mist': {
    distribution: 'mist',
    seed: 419,
    density: 0.3,
    starSpeed: 0.5,
    verticalRatio: -0.08,
    direction: -1,
    twinkleSpeed: 0.3,
    twinkleAmount: 0.3,
    meteorInterval: 0,
  },
  'blue-horizon': {
    distribution: 'horizon',
    seed: 541,
    density: 0.95,
    starSpeed: 1.6,
    verticalRatio: 0,
    direction: 1,
    twinkleSpeed: 0.65,
    twinkleAmount: 0.5,
    meteorInterval: 0,
  },
}

export function getBackgroundMotionProfile(backgroundId?: string): MotionProfile {
  return BACKGROUND_MOTION_PROFILES[backgroundId ?? ''] ?? BACKGROUND_MOTION_PROFILES['stellar-drift']
}
