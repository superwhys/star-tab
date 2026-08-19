import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { findBookmarkNode } from '../utils/bookmarks'
import { useStarPageStore } from './starPage'

describe('star page store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('loads mock bookmarks and defaults to the bookmarks bar', async () => {
    const store = useStarPageStore()
    await store.init()

    expect(store.visibleSections.map((section) => section.id)).toEqual(['1'])
    expect(store.folderOptions.some((folder) => folder.id === '110')).toBe(true)
  })

  it('navigates nested folders and closes the overlay', async () => {
    const store = useStarPageStore()
    await store.init()
    const development = findBookmarkNode(store.bookmarkTree, '110')!
    const repositories = findBookmarkNode(store.bookmarkTree, '116')!

    store.openFolder(development)
    store.enterFolder(repositories)
    expect(store.activeFolderPath.map((folder) => folder.id)).toEqual(['110', '116'])

    store.navigateFolder(0)
    expect(store.activeFolder?.id).toBe('110')

    store.closeFolder()
    expect(store.activeFolder).toBeUndefined()
  })

  it('restores settings after a fresh store initialization', async () => {
    const firstStore = useStarPageStore()
    await firstStore.init()
    await firstStore.updateSettings({
      backgroundId: 'violet-orbit',
      bookmarkLayout: 'constellation',
      showSeconds: false,
    })
    expect(firstStore.settingsSaveState).toBe('saved')

    setActivePinia(createPinia())
    const restoredStore = useStarPageStore()
    await restoredStore.init()

    expect(restoredStore.settings.backgroundId).toBe('violet-orbit')
    expect(restoredStore.settings.bookmarkLayout).toBe('constellation')
    expect(restoredStore.settings.showSeconds).toBe(false)
  })

  it('reorders visible folders and persists their homepage order', async () => {
    const firstStore = useStarPageStore()
    await firstStore.init()
    await firstStore.updateSettings({ visibleFolderIds: ['1', '110', '120'] })
    await firstStore.moveVisibleFolder('120', -1)

    expect(firstStore.settings.visibleFolderIds).toEqual(['1', '120', '110'])
    expect(firstStore.visibleSections.map((section) => section.id)).toEqual(['1', '120', '110'])

    setActivePinia(createPinia())
    const restoredStore = useStarPageStore()
    await restoredStore.init()
    expect(restoredStore.settings.visibleFolderIds).toEqual(['1', '120', '110'])
  })
})
