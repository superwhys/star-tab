import { BACKGROUND_IDS } from '../backgrounds'
import type { StarPageSettings } from '../types'

export const SETTINGS_STORAGE_KEY = 'star-page:settings'

export const DEFAULT_SETTINGS: StarPageSettings = {
  version: 1,
  backgroundId: 'stellar-drift',
  visibleFolderIds: [],
  showSeconds: true,
  compactMode: false,
  motionEnabled: true,
}

export function sanitizeSettings(value: unknown): StarPageSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS }
  const candidate = value as Partial<StarPageSettings>

  return {
    version: 1,
    backgroundId:
      typeof candidate.backgroundId === 'string' && BACKGROUND_IDS.includes(candidate.backgroundId)
        ? candidate.backgroundId
        : DEFAULT_SETTINGS.backgroundId,
    visibleFolderIds: Array.isArray(candidate.visibleFolderIds)
      ? candidate.visibleFolderIds.filter((id): id is string => typeof id === 'string')
      : [],
    showSeconds:
      typeof candidate.showSeconds === 'boolean' ? candidate.showSeconds : DEFAULT_SETTINGS.showSeconds,
    compactMode:
      typeof candidate.compactMode === 'boolean' ? candidate.compactMode : DEFAULT_SETTINGS.compactMode,
    motionEnabled:
      typeof candidate.motionEnabled === 'boolean' ? candidate.motionEnabled : DEFAULT_SETTINGS.motionEnabled,
  }
}
