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
      bookmarkLayout: 'constellation',
      showSeconds: false,
      compactMode: true,
      motionEnabled: false,
    })

    expect(result).toEqual({
      version: 2,
      backgroundId: 'violet-orbit',
      visibleFolderIds: ['1', '110'],
      bookmarkLayout: 'constellation',
      showSeconds: false,
      compactMode: true,
      motionEnabled: false,
    })
  })

  it('falls back from an unknown background', () => {
    expect(sanitizeSettings({ backgroundId: 'unknown' }).backgroundId).toBe(DEFAULT_SETTINGS.backgroundId)
  })

  it('migrates old settings to the grid layout and rejects unknown layouts', () => {
    expect(sanitizeSettings({ version: 1 }).bookmarkLayout).toBe('grid')
    expect(sanitizeSettings({ bookmarkLayout: 'list' }).bookmarkLayout).toBe('grid')
  })
})
