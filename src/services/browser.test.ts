import { isProxy, reactive } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../utils/settings'
import { createBookmark, createSettingsSnapshot, deleteBookmark, updateBookmark, writeSettings } from './browser'

afterEach(() => vi.unstubAllGlobals())

describe('settings persistence adapter', () => {
  it('turns Vue reactive settings into a plain serializable snapshot', () => {
    const source = reactive({
      ...DEFAULT_SETTINGS,
      visibleFolderIds: ['1', '110'],
    })

    const snapshot = createSettingsSnapshot(source)

    expect(isProxy(source)).toBe(true)
    expect(isProxy(snapshot)).toBe(false)
    expect(isProxy(snapshot.visibleFolderIds)).toBe(false)
    expect(snapshot).toEqual(source)
  })

  it('writes only the plain snapshot to Chrome Storage', async () => {
    let captured: Record<string, unknown> | undefined
    vi.stubGlobal('chrome', {
      runtime: { lastError: undefined },
      storage: {
        local: {
          set(value: Record<string, unknown>, callback: () => void) {
            captured = value
            callback()
          },
        },
      },
    })

    await writeSettings(reactive({ ...DEFAULT_SETTINGS, backgroundId: 'violet-orbit' }))

    const stored = captured?.[SETTINGS_STORAGE_KEY]
    expect(isProxy(stored)).toBe(false)
    expect(stored).toMatchObject({
      backgroundId: 'violet-orbit',
      bookmarkLayout: 'grid',
      searchEngineId: 'default',
      version: 3,
    })
  })
})

describe('bookmark mutation adapter', () => {
  it('forwards create, update and delete operations to Chrome bookmarks', async () => {
    const calls: unknown[] = []
    vi.stubGlobal('chrome', {
      runtime: { lastError: undefined },
      bookmarks: {
        create(value: unknown, callback: () => void) {
          calls.push(['create', value])
          callback()
        },
        update(id: string, value: unknown, callback: () => void) {
          calls.push(['update', id, value])
          callback()
        },
        remove(id: string, callback: () => void) {
          calls.push(['remove', id])
          callback()
        },
      },
    })

    await createBookmark('1', 'Example', 'https://example.com/')
    await updateBookmark('10', 'Updated', 'https://updated.example.com/')
    await deleteBookmark('10')

    expect(calls).toEqual([
      ['create', { parentId: '1', title: 'Example', url: 'https://example.com/' }],
      ['update', '10', { title: 'Updated', url: 'https://updated.example.com/' }],
      ['remove', '10'],
    ])
  })
})
