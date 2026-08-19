export type BookmarkNodeType = 'bookmark' | 'folder'

export interface BookmarkNode {
  id: string
  parentId?: string
  title: string
  type: BookmarkNodeType
  url?: string
  children: BookmarkNode[]
  folderType?: 'bookmarks-bar' | 'other' | 'mobile' | 'managed'
}

export interface FolderOption {
  id: string
  title: string
  depth: number
  folderType?: BookmarkNode['folderType']
}

export type BackgroundKind = 'canvas-drift' | 'canvas-meteor' | 'ambient'

export type SettingsSaveState = 'idle' | 'saving' | 'saved' | 'error'

export interface BackgroundPreset {
  id: string
  name: string
  description: string
  kind: BackgroundKind
  className: string
}

export interface StarPageSettings {
  version: 1
  backgroundId: string
  visibleFolderIds: string[]
  showSeconds: boolean
  compactMode: boolean
  motionEnabled: boolean
}
