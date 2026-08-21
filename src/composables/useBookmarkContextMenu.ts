import { shallowRef } from 'vue'
import type { BookmarkNode } from '../types'

export interface BookmarkContextMenuState {
  node: BookmarkNode
  x: number
  y: number
}

const contextMenu = shallowRef<BookmarkContextMenuState>()

export function useBookmarkContextMenu() {
  function openContextMenu(node: BookmarkNode, event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    contextMenu.value = { node, x: event.clientX, y: event.clientY }
  }

  function closeContextMenu() {
    contextMenu.value = undefined
  }

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  }
}
