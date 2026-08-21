import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { BookmarkNode, SettingsSaveState, StarPageSettings } from '../types'
import {
  createBookmark as createBrowserBookmark,
  deleteBookmark as deleteBrowserBookmark,
  readBookmarks,
  readSettings,
  readSettingsSyncPreference,
  subscribeBookmarkChanges,
  subscribeSettingsChanges,
  updateBookmark as updateBrowserBookmark,
  writeSettings,
  writeSettingsSyncPreference,
} from '../services/browser'
import { findBookmarkNode, findDefaultBookmarkFolder, flattenFolders } from '../utils/bookmarks'
import { DEFAULT_SETTINGS, sanitizeSettings } from '../utils/settings'

export const useStarPageStore = defineStore('star-page', () => {
  const bookmarkTree = ref<BookmarkNode[]>([])
  const settings = ref<StarPageSettings>({ ...DEFAULT_SETTINGS })
  const loading = ref(true)
  const bookmarkError = ref('')
  const settingsSaveState = ref<SettingsSaveState>('idle')
  const settingsError = ref('')
  const settingsSyncEnabled = ref(false)
  const settingsOpen = ref(false)
  const activeFolderPath = ref<BookmarkNode[]>([])
  const initialized = ref(false)
  let settingsExisted = false
  let unsubscribeBookmarks: (() => void) | undefined
  let unsubscribeSettings: (() => void) | undefined
  let refreshTimer: number | undefined
  let saveRequestId = 0
  let saveQueue: Promise<void> = Promise.resolve()
  let savedStateTimer: number | undefined

  const folderOptions = computed(() => flattenFolders(bookmarkTree.value))
  const visibleSections = computed(() =>
    settings.value.visibleFolderIds
      .map((id) => findBookmarkNode(bookmarkTree.value, id))
      .filter((node): node is BookmarkNode => Boolean(node && node.type === 'folder')),
  )
  const activeFolder = computed(() => activeFolderPath.value.at(-1))

  async function init() {
    if (initialized.value) return
    initialized.value = true
    loading.value = true

    try {
      settingsSyncEnabled.value = await readSettingsSyncPreference()
      let stored = await readSettings(settingsSyncEnabled.value ? 'sync' : 'local')
      if (settingsSyncEnabled.value && !stored.exists) {
        const local = await readSettings('local')
        if (local.exists) stored = local
      }
      settingsExisted = stored.exists && Boolean(stored.value && typeof stored.value === 'object')
      settings.value = sanitizeSettings(stored.value)
      if (settingsSyncEnabled.value && settingsExisted) await writeSettings(settings.value, 'sync')
    } catch (error) {
      settingsExisted = false
      settings.value = { ...DEFAULT_SETTINGS }
      settingsError.value = error instanceof Error ? error.message : '无法读取已保存的设置'
      settingsSaveState.value = 'error'
    }
    await refreshBookmarks()

    unsubscribeBookmarks = subscribeBookmarkChanges(scheduleRefresh)
    unsubscribeSettings = subscribeSettingsChanges((area) => {
      if (area === 'sync' && settingsSyncEnabled.value) void refreshSyncedSettings()
    })
    window.addEventListener('beforeunload', dispose, { once: true })
    loading.value = false
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer)
    refreshTimer = window.setTimeout(() => void refreshBookmarks(), 80)
  }

  async function refreshBookmarks() {
    try {
      const openFolderIds = activeFolderPath.value.map((folder) => folder.id)
      bookmarkTree.value = await readBookmarks()
      activeFolderPath.value = openFolderIds
        .map((id) => findBookmarkNode(bookmarkTree.value, id))
        .filter((node): node is BookmarkNode => Boolean(node?.type === 'folder'))
      bookmarkError.value = ''

      if (!settingsExisted && settings.value.visibleFolderIds.length === 0) {
        const defaultFolder = findDefaultBookmarkFolder(bookmarkTree.value)
        if (defaultFolder) {
          settings.value.visibleFolderIds = [defaultFolder.id]
          await persistSettings(settings.value)
          settingsExisted = true
        }
      }
    } catch (error) {
      bookmarkError.value = error instanceof Error ? error.message : '无法读取浏览器书签'
    }
  }

  async function createBookmark(parentId: string, title: string, url: string) {
    await createBrowserBookmark(parentId, title, url)
    await refreshBookmarks()
  }

  async function updateBookmark(id: string, title: string, url: string) {
    await updateBrowserBookmark(id, title, url)
    await refreshBookmarks()
  }

  async function deleteBookmark(id: string) {
    await deleteBrowserBookmark(id)
    await refreshBookmarks()
  }

  async function refreshSyncedSettings() {
    const stored = await readSettings('sync')
    if (!stored.exists || !stored.value || typeof stored.value !== 'object') return
    settings.value = sanitizeSettings(stored.value)
    settingsExisted = true
  }

  async function setSettingsSyncEnabled(enabled: boolean) {
    if (settingsSyncEnabled.value === enabled) return
    const previous = settingsSyncEnabled.value
    window.clearTimeout(savedStateTimer)
    settingsSaveState.value = 'saving'
    settingsError.value = ''

    try {
      if (enabled) {
        const synced = await readSettings('sync')
        if (synced.exists && synced.value && typeof synced.value === 'object') {
          settings.value = sanitizeSettings(synced.value)
        }
        await writeSettings(settings.value, 'sync')
      } else {
        await writeSettings(settings.value, 'local')
      }
      await writeSettingsSyncPreference(enabled)
      settingsSyncEnabled.value = enabled
      settingsExisted = true
      markSettingsSaved()
    } catch (error) {
      settingsSyncEnabled.value = previous
      settingsSaveState.value = 'error'
      settingsError.value = error instanceof Error ? error.message : '同步设置失败'
    }
  }

  async function updateSettings(patch: Partial<Omit<StarPageSettings, 'version'>>) {
    settings.value = sanitizeSettings({ ...settings.value, ...patch, version: 3 })
    settingsExisted = true
    await persistSettings(settings.value)
  }

  function persistSettings(value: StarPageSettings): Promise<void> {
    const requestId = ++saveRequestId
    const snapshot: StarPageSettings = {
      ...value,
      visibleFolderIds: [...value.visibleFolderIds],
    }
    const storageArea = settingsSyncEnabled.value ? 'sync' : 'local'

    window.clearTimeout(savedStateTimer)
    settingsSaveState.value = 'saving'
    settingsError.value = ''

    const operation = saveQueue
      .catch(() => undefined)
      .then(() => writeSettings(snapshot, storageArea))
      .then(() => {
        if (requestId !== saveRequestId) return
        markSettingsSaved()
      })
      .catch((error) => {
        if (requestId !== saveRequestId) return
        settingsSaveState.value = 'error'
        settingsError.value = error instanceof Error ? error.message : '设置保存失败'
      })

    saveQueue = operation
    return operation
  }

  function markSettingsSaved() {
    settingsSaveState.value = 'saved'
    savedStateTimer = window.setTimeout(() => {
      if (settingsSaveState.value === 'saved') settingsSaveState.value = 'idle'
    }, 1800)
  }

  function toggleFolderVisibility(folderId: string) {
    const selected = new Set(settings.value.visibleFolderIds)
    if (selected.has(folderId)) selected.delete(folderId)
    else selected.add(folderId)
    return updateSettings({ visibleFolderIds: [...selected] })
  }

  function moveVisibleFolder(folderId: string, offset: -1 | 1): Promise<void> {
    const orderedIds = [...settings.value.visibleFolderIds]
    const currentIndex = orderedIds.indexOf(folderId)
    const targetIndex = currentIndex + offset
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedIds.length) return Promise.resolve()

    const targetId = orderedIds[targetIndex]
    orderedIds[targetIndex] = folderId
    orderedIds[currentIndex] = targetId
    return updateSettings({ visibleFolderIds: orderedIds })
  }

  function openFolder(folder: BookmarkNode) {
    if (folder.type !== 'folder') return
    activeFolderPath.value = [folder]
  }

  function enterFolder(folder: BookmarkNode) {
    if (folder.type !== 'folder') return
    activeFolderPath.value.push(folder)
  }

  function navigateFolder(index: number) {
    activeFolderPath.value = activeFolderPath.value.slice(0, index + 1)
  }

  function closeFolder() {
    activeFolderPath.value = []
  }

  function dispose() {
    unsubscribeBookmarks?.()
    unsubscribeSettings?.()
    window.clearTimeout(refreshTimer)
    window.clearTimeout(savedStateTimer)
  }

  return {
    bookmarkTree,
    settings,
    loading,
    bookmarkError,
    settingsSaveState,
    settingsError,
    settingsSyncEnabled,
    settingsOpen,
    activeFolderPath,
    activeFolder,
    folderOptions,
    visibleSections,
    init,
    refreshBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    setSettingsSyncEnabled,
    updateSettings,
    toggleFolderVisibility,
    moveVisibleFolder,
    openFolder,
    enterFolder,
    navigateFolder,
    closeFolder,
  }
})
