import { MOCK_BOOKMARK_TREE } from '../data/mockBookmarks'
import type { BookmarkNode, StarPageSettings } from '../types'
import { normalizeBookmarkTree } from '../utils/bookmarks'
import { SETTINGS_STORAGE_KEY } from '../utils/settings'

function hasChromeApi<K extends keyof typeof chrome>(key: K): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome[key])
}

export function isExtensionRuntime(): boolean {
  return hasChromeApi('runtime') && Boolean(chrome.runtime?.id)
}

export async function readBookmarks(): Promise<BookmarkNode[]> {
  if (!hasChromeApi('bookmarks')) return structuredClone(MOCK_BOOKMARK_TREE)

  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((nodes) => {
      const error = chrome.runtime.lastError
      if (error) {
        reject(new Error(error.message))
        return
      }
      resolve(normalizeBookmarkTree(nodes))
    })
  })
}

export function subscribeBookmarkChanges(refresh: () => void): () => void {
  if (!hasChromeApi('bookmarks')) return () => undefined

  const listener = () => refresh()
  chrome.bookmarks.onCreated.addListener(listener)
  chrome.bookmarks.onRemoved.addListener(listener)
  chrome.bookmarks.onChanged.addListener(listener)
  chrome.bookmarks.onMoved.addListener(listener)
  chrome.bookmarks.onChildrenReordered.addListener(listener)

  return () => {
    chrome.bookmarks.onCreated.removeListener(listener)
    chrome.bookmarks.onRemoved.removeListener(listener)
    chrome.bookmarks.onChanged.removeListener(listener)
    chrome.bookmarks.onMoved.removeListener(listener)
    chrome.bookmarks.onChildrenReordered.removeListener(listener)
  }
}

export async function readSettings(): Promise<{ value?: unknown; exists: boolean }> {
  if (!hasChromeApi('storage')) {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return { exists: false }
    try {
      return { exists: true, value: JSON.parse(raw) }
    } catch {
      return { exists: true }
    }
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(SETTINGS_STORAGE_KEY, (result) => {
      const error = chrome.runtime.lastError
      if (error) {
        reject(new Error(error.message))
        return
      }
      resolve({
        exists: Object.prototype.hasOwnProperty.call(result, SETTINGS_STORAGE_KEY),
        value: result[SETTINGS_STORAGE_KEY],
      })
    })
  })
}

export async function writeSettings(settings: StarPageSettings): Promise<void> {
  const snapshot = createSettingsSnapshot(settings)

  if (!hasChromeApi('storage')) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(snapshot))
    return
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: snapshot }, () => {
      const error = chrome.runtime.lastError
      if (error) {
        reject(new Error(error.message))
        return
      }
      resolve()
    })
  })
}

export function createSettingsSnapshot(settings: StarPageSettings): StarPageSettings {
  return {
    version: 1,
    backgroundId: settings.backgroundId,
    visibleFolderIds: [...settings.visibleFolderIds],
    showSeconds: settings.showSeconds,
    compactMode: settings.compactMode,
    motionEnabled: settings.motionEnabled,
  }
}

export async function searchWithDefaultEngine(text: string): Promise<'chrome' | 'prototype'> {
  if (!hasChromeApi('search')) return 'prototype'

  return new Promise((resolve, reject) => {
    chrome.search.query({ text, disposition: 'CURRENT_TAB' }, () => {
      const error = chrome.runtime.lastError
      if (error) {
        reject(new Error(error.message))
        return
      }
      resolve('chrome')
    })
  })
}

export function faviconUrl(pageUrl?: string, size = 64): string | undefined {
  if (!pageUrl || !isExtensionRuntime()) return undefined
  const url = new URL(chrome.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', pageUrl)
  url.searchParams.set('size', String(size))
  return url.toString()
}
