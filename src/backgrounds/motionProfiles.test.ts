import { describe, expect, it } from 'vitest'
import { BACKGROUND_PRESETS } from '.'
import { BACKGROUND_MOTION_PROFILES, getBackgroundMotionProfile } from './motionProfiles'

describe('background motion profiles', () => {
  it('defines an independent motion profile for every background', () => {
    for (const preset of BACKGROUND_PRESETS) {
      expect(BACKGROUND_MOTION_PROFILES[preset.id], preset.id).toBeDefined()
    }
  })

  it('falls back to the default profile for an unknown background', () => {
    expect(getBackgroundMotionProfile('missing')).toEqual(
      BACKGROUND_MOTION_PROFILES['stellar-drift'],
    )
  })
})
