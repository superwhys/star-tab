import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { BookmarkNode, SettingsSaveState, StarPageSettings } from '../types'
import { readBookmarks, readSettings, subscribeBookmarkChanges, writeSettings } from '../services/browser'
import { findBookmarkNode, findDefaultBookmarkFolder, flattenFolders } from '../utils/bookmarks'
import { DEFAULT_SETTINGS, sanitizeSettings } from '../utils/settings'

export const useStarPageStore = defineStore('star-page', () => {
  const bookmarkTree = ref<BookmarkNode[]>([])
  const settings = ref<StarPageSettings>({ ...DEFAULT_SETTINGS })
  const loading = ref(true)
  const bookmarkError = ref('')
  const settingsSaveState = ref<SettingsSaveState>('idle')
  const settingsError = ref('')
  const settingsOpen = ref(false)
  const activeFolderPath = ref<BookmarkNode[]>([])
  const initialized = ref(false)
  let settingsExisted = false
  let unsubscribeBookmarks: (() => void) | undefined
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
      const stored = await readSettings()
      settingsExisted = stored.exists && Boolean(stored.value && typeof stored.value === 'object')
      settings.value = sanitizeSettings(stored.value)
    } catch (error) {
      settingsExisted = false
      settings.value = { ...DEFAULT_SETTINGS }
      settingsError.value = error instanceof Error ? error.message : '无法读取已保存的设置'
      settingsSaveState.value = 'error'
    }
    await refreshBookmarks()

    unsubscribeBookmarks = subscribeBookmarkChanges(scheduleRefresh)
    window.addEventListener('beforeunload', dispose, { once: true })
    loading.value = false
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer)
    refreshTimer = window.setTimeout(() => void refreshBookmarks(), 80)
  }

  async function refreshBookmarks() {
    try {
      bookmarkTree.value = await readBookmarks()
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

  async function updateSettings(patch: Partial<Omit<StarPageSettings, 'version'>>) {
    settings.value = sanitizeSettings({ ...settings.value, ...patch, version: 1 })
    settingsExisted = true
    await persistSettings(settings.value)
  }

  function persistSettings(value: StarPageSettings): Promise<void> {
    const requestId = ++saveRequestId
    const snapshot: StarPageSettings = {
      ...value,
      visibleFolderIds: [...value.visibleFolderIds],
    }

    window.clearTimeout(savedStateTimer)
    settingsSaveState.value = 'saving'
    settingsError.value = ''

    const operation = saveQueue
      .catch(() => undefined)
      .then(() => writeSettings(snapshot))
      .then(() => {
        if (requestId !== saveRequestId) return
        settingsSaveState.value = 'saved'
        savedStateTimer = window.setTimeout(() => {
          if (settingsSaveState.value === 'saved') settingsSaveState.value = 'idle'
        }, 1800)
      })
      .catch((error) => {
        if (requestId !== saveRequestId) return
        settingsSaveState.value = 'error'
        settingsError.value = error instanceof Error ? error.message : '设置保存失败'
      })

    saveQueue = operation
    return operation
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
    settingsOpen,
    activeFolderPath,
    activeFolder,
    folderOptions,
    visibleSections,
    init,
    refreshBookmarks,
    updateSettings,
    toggleFolderVisibility,
    moveVisibleFolder,
    openFolder,
    enterFolder,
    navigateFolder,
    closeFolder,
  }
})
