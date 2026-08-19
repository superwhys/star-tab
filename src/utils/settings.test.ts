import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings'

describe('settings migration', () => {
  it('returns defaults for missing data', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid preferences and removes invalid folder ids', () => {
    const result = sanitizeSettings({
      version: 7,
      backgroundId: 'violet-orbit',
      visibleFolderIds: ['1', 2, null, '110'],
      showSeconds: false,
      compactMode: true,
      motionEnabled: false,
    })

    expect(result).toEqual({
      version: 1,
      backgroundId: 'violet-orbit',
      visibleFolderIds: ['1', '110'],
      showSeconds: false,
      compactMode: true,
      motionEnabled: false,
    })
  })

  it('falls back from an unknown background', () => {
    expect(sanitizeSettings({ backgroundId: 'unknown' }).backgroundId).toBe(DEFAULT_SETTINGS.backgroundId)
  })
})

