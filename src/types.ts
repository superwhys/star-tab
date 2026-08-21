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

export type BookmarkLayout = 'grid' | 'constellation'

export type SearchEngineId = 'default' | 'google' | 'bing' | 'baidu' | 'duckduckgo'

export interface BookmarkSearchState {
  query: string
  matchIds: string[]
  matches?: BookmarkNode[]
  activeId?: string
}

export interface BookmarkSearchResult {
  node: BookmarkNode
  folderPath: string[]
}

export interface SearchHighlightSegment {
  text: string
  matched: boolean
}

export interface BackgroundPreset {
  id: string
  name: string
  description: string
  kind: BackgroundKind
  className: string
}

export interface StarPageSettings {
  version: 3
  backgroundId: string
  visibleFolderIds: string[]
  bookmarkLayout: BookmarkLayout
  searchEngineId: SearchEngineId
  showSeconds: boolean
  compactMode: boolean
  motionEnabled: boolean
}
