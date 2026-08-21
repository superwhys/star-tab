import { shallowRef } from 'vue'
import type { BookmarkNode } from '../types'

export type BookmarkEditorState =
  | { mode: 'create'; parent: BookmarkNode }
  | { mode: 'edit'; bookmark: BookmarkNode }
  | { mode: 'delete'; bookmark: BookmarkNode }

const editorState = shallowRef<BookmarkEditorState>()

export function useBookmarkEditor() {
  function openCreateBookmark(parent: BookmarkNode) {
    if (parent.type === 'folder') editorState.value = { mode: 'create', parent }
  }

  function openEditBookmark(bookmark: BookmarkNode) {
    if (bookmark.type === 'bookmark') editorState.value = { mode: 'edit', bookmark }
  }

  function openDeleteBookmark(bookmark: BookmarkNode) {
    if (bookmark.type === 'bookmark') editorState.value = { mode: 'delete', bookmark }
  }

  function closeBookmarkEditor() {
    editorState.value = undefined
  }

  return {
    editorState,
    openCreateBookmark,
    openEditBookmark,
    openDeleteBookmark,
    closeBookmarkEditor,
  }
}
