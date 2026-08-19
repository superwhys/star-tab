import { BACKGROUND_IDS } from '../backgrounds'
import { isSearchEngineId } from '../search/engines'
import type { BookmarkLayout, StarPageSettings } from '../types'

export const SETTINGS_STORAGE_KEY = 'star-page:settings'

export const DEFAULT_SETTINGS: StarPageSettings = {
  version: 3,
  backgroundId: 'stellar-drift',
  visibleFolderIds: [],
  bookmarkLayout: 'grid',
  searchEngineId: 'default',
  showSeconds: true,
  compactMode: false,
  motionEnabled: true,
}

export function sanitizeSettings(value: unknown): StarPageSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS }
  const candidate = value as Partial<StarPageSettings>

  return {
    version: 3,
    backgroundId:
      typeof candidate.backgroundId === 'string' && BACKGROUND_IDS.includes(candidate.backgroundId)
        ? candidate.backgroundId
        : DEFAULT_SETTINGS.backgroundId,
    visibleFolderIds: Array.isArray(candidate.visibleFolderIds)
      ? candidate.visibleFolderIds.filter((id): id is string => typeof id === 'string')
      : [],
    bookmarkLayout: isBookmarkLayout(candidate.bookmarkLayout)
      ? candidate.bookmarkLayout
      : DEFAULT_SETTINGS.bookmarkLayout,
    searchEngineId: isSearchEngineId(candidate.searchEngineId)
      ? candidate.searchEngineId
      : DEFAULT_SETTINGS.searchEngineId,
    showSeconds:
      typeof candidate.showSeconds === 'boolean' ? candidate.showSeconds : DEFAULT_SETTINGS.showSeconds,
    compactMode:
      typeof candidate.compactMode === 'boolean' ? candidate.compactMode : DEFAULT_SETTINGS.compactMode,
    motionEnabled:
      typeof candidate.motionEnabled === 'boolean' ? candidate.motionEnabled : DEFAULT_SETTINGS.motionEnabled,
  }
}

function isBookmarkLayout(value: unknown): value is BookmarkLayout {
  return value === 'grid' || value === 'constellation'
}
