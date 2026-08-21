import { MOCK_BOOKMARK_TREE } from '../data/mockBookmarks'
import { buildSearchUrl } from '../search/engines'
import type { BookmarkNode, SearchEngineId, StarPageSettings } from '../types'
import { normalizeBookmarkTree } from '../utils/bookmarks'
import { SETTINGS_STORAGE_KEY } from '../utils/settings'

export type SettingsStorageArea = 'local' | 'sync'
export const SETTINGS_SYNC_PREFERENCE_KEY = 'star-page:settings-sync-enabled'

let prototypeBookmarkTree = structuredClone(MOCK_BOOKMARK_TREE)
let prototypeBookmarkId = 10000

function hasChromeApi<K extends keyof typeof chrome>(key: K): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome[key])
}

export function isExtensionRuntime(): boolean {
  return hasChromeApi('runtime') && Boolean(chrome.runtime?.id)
}

export async function readBookmarks(): Promise<BookmarkNode[]> {
  if (!hasChromeApi('bookmarks')) return structuredClone(prototypeBookmarkTree)

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

export async function createBookmark(parentId: string, title: string, url: string): Promise<void> {
  if (!hasChromeApi('bookmarks')) {
    const parent = findPrototypeBookmarkNode(prototypeBookmarkTree, parentId)
    if (!parent || parent.type !== 'folder') throw new Error('找不到目标书签文件夹')
    parent.children.push({
      id: `prototype-${prototypeBookmarkId++}`,
      parentId,
      title,
      url,
      type: 'bookmark',
      children: [],
    })
    return
  }

  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({ parentId, title, url }, () => settleChromeCallback(resolve, reject))
  })
}

export async function updateBookmark(id: string, title: string, url: string): Promise<void> {
  if (!hasChromeApi('bookmarks')) {
    const bookmark = findPrototypeBookmarkNode(prototypeBookmarkTree, id)
    if (!bookmark || bookmark.type !== 'bookmark') throw new Error('找不到要编辑的书签')
    bookmark.title = title
    bookmark.url = url
    return
  }

  return new Promise((resolve, reject) => {
    chrome.bookmarks.update(id, { title, url }, () => settleChromeCallback(resolve, reject))
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  if (!hasChromeApi('bookmarks')) {
    if (!removePrototypeBookmark(prototypeBookmarkTree, id)) throw new Error('找不到要删除的书签')
    return
  }

  return new Promise((resolve, reject) => {
    chrome.bookmarks.remove(id, () => settleChromeCallback(resolve, reject))
  })
}

function findPrototypeBookmarkNode(nodes: BookmarkNode[], id: string): BookmarkNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const match = findPrototypeBookmarkNode(node.children, id)
    if (match) return match
  }
  return undefined
}

function removePrototypeBookmark(nodes: BookmarkNode[], id: string): boolean {
  for (const node of nodes) {
    const index = node.children.findIndex((child) => child.id === id && child.type === 'bookmark')
    if (index >= 0) {
      node.children.splice(index, 1)
      return true
    }
    if (removePrototypeBookmark(node.children, id)) return true
  }
  return false
}

function settleChromeCallback(resolve: () => void, reject: (reason: Error) => void) {
  const error = chrome.runtime.lastError
  if (error) reject(new Error(error.message))
  else resolve()
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

export async function readSettings(area: SettingsStorageArea = 'local'): Promise<{ value?: unknown; exists: boolean }> {
  if (!hasChromeApi('storage')) {
    const raw = localStorage.getItem(settingsStorageKey(area))
    if (!raw) return { exists: false }
    try {
      return { exists: true, value: JSON.parse(raw) }
    } catch {
      return { exists: true }
    }
  }

  return new Promise((resolve, reject) => {
    chrome.storage[area].get(SETTINGS_STORAGE_KEY, (result) => {
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

export async function writeSettings(
  settings: StarPageSettings,
  area: SettingsStorageArea = 'local',
): Promise<void> {
  const snapshot = createSettingsSnapshot(settings)

  if (!hasChromeApi('storage')) {
    localStorage.setItem(settingsStorageKey(area), JSON.stringify(snapshot))
    return
  }

  return new Promise((resolve, reject) => {
    chrome.storage[area].set({ [SETTINGS_STORAGE_KEY]: snapshot }, () => {
      const error = chrome.runtime.lastError
      if (error) {
        reject(new Error(error.message))
        return
      }
      resolve()
    })
  })
}

export async function readSettingsSyncPreference(): Promise<boolean> {
  if (!hasChromeApi('storage')) return localStorage.getItem(SETTINGS_SYNC_PREFERENCE_KEY) === 'true'

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(SETTINGS_SYNC_PREFERENCE_KEY, (result) => {
      const error = chrome.runtime.lastError
      if (error) {
        reject(new Error(error.message))
        return
      }
      resolve(result[SETTINGS_SYNC_PREFERENCE_KEY] === true)
    })
  })
}

export async function writeSettingsSyncPreference(enabled: boolean): Promise<void> {
  if (!hasChromeApi('storage')) {
    localStorage.setItem(SETTINGS_SYNC_PREFERENCE_KEY, String(enabled))
    return
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [SETTINGS_SYNC_PREFERENCE_KEY]: enabled }, () => {
      const error = chrome.runtime.lastError
      if (error) {
        reject(new Error(error.message))
        return
      }
      resolve()
    })
  })
}

export function subscribeSettingsChanges(refresh: (area: SettingsStorageArea) => void): () => void {
  if (!hasChromeApi('storage') || !chrome.storage.onChanged) return () => undefined

  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (changes[SETTINGS_STORAGE_KEY] && (areaName === 'local' || areaName === 'sync')) {
      refresh(areaName)
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

function settingsStorageKey(area: SettingsStorageArea): string {
  return area === 'sync' ? `${SETTINGS_STORAGE_KEY}:sync` : SETTINGS_STORAGE_KEY
}

export function createSettingsSnapshot(settings: StarPageSettings): StarPageSettings {
  return {
    version: 3,
    backgroundId: settings.backgroundId,
    visibleFolderIds: [...settings.visibleFolderIds],
    bookmarkLayout: settings.bookmarkLayout,
    searchEngineId: settings.searchEngineId,
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

export async function searchWithEngine(
  text: string,
  engineId: SearchEngineId,
): Promise<'chrome' | 'navigation' | 'prototype'> {
  if (engineId === 'default') return searchWithDefaultEngine(text)
  if (!isExtensionRuntime()) return 'prototype'

  window.location.assign(buildSearchUrl(engineId, text))
  return 'navigation'
}

export function faviconUrl(pageUrl?: string, size = 64): string | undefined {
  if (!pageUrl || !isExtensionRuntime()) return undefined
  const url = new URL(chrome.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', pageUrl)
  url.searchParams.set('size', String(size))
  return url.toString()
}
