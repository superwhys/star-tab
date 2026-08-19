export interface MotionProfile {
  starSpeed: number
  dustSpeed: number
  verticalRatio: number
  direction: 1 | -1
  twinkleSpeed: number
  twinkleAmount: number
  meteorInterval: number
}

const ambientProfile: MotionProfile = {
  starSpeed: 7.8,
  dustSpeed: 15,
  verticalRatio: 0.3,
  direction: 1,
  twinkleSpeed: 1.8,
  twinkleAmount: 0.3,
  meteorInterval: 5600,
}

export const BACKGROUND_MOTION_PROFILES: Record<string, MotionProfile> = {
  'stellar-drift': {
    starSpeed: 14.5,
    dustSpeed: 26,
    verticalRatio: 0.36,
    direction: 1,
    twinkleSpeed: 2.05,
    twinkleAmount: 0.32,
    meteorInterval: 4200,
  },
  'meteor-night': {
    starSpeed: 11.5,
    dustSpeed: 21,
    verticalRatio: 0.42,
    direction: -1,
    twinkleSpeed: 2.25,
    twinkleAmount: 0.34,
    meteorInterval: 1850,
  },
  'indigo-nebula': { ...ambientProfile },
  'violet-orbit': { ...ambientProfile },
  'lunar-mist': { ...ambientProfile },
  'blue-horizon': { ...ambientProfile },
}

export function getBackgroundMotionProfile(backgroundId?: string): MotionProfile {
  return BACKGROUND_MOTION_PROFILES[backgroundId ?? ''] ?? BACKGROUND_MOTION_PROFILES['stellar-drift']
}
