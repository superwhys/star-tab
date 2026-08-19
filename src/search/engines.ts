import type { SearchEngineId } from '../types'

export interface SearchEngineOption {
  id: SearchEngineId
  name: string
  shortName: string
  description: string
  mark: string
  accent: string
}

export const SEARCH_ENGINES: readonly SearchEngineOption[] = [
  {
    id: 'default',
    name: '浏览器默认',
    shortName: '默认',
    description: '跟随 Chrome 当前设置',
    mark: '⌁',
    accent: '#a9bcff',
  },
  {
    id: 'google',
    name: 'Google',
    shortName: 'Google',
    description: '使用 Google 搜索',
    mark: 'G',
    accent: '#77a7ff',
  },
  {
    id: 'bing',
    name: 'Bing',
    shortName: 'Bing',
    description: '使用 Bing 搜索',
    mark: 'B',
    accent: '#3ed7c4',
  },
  {
    id: 'baidu',
    name: '百度',
    shortName: '百度',
    description: '使用百度搜索',
    mark: '百',
    accent: '#6d8cff',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    shortName: 'DuckDuckGo',
    description: '使用 DuckDuckGo 搜索',
    mark: 'D',
    accent: '#ff9b68',
  },
] as const

export function isSearchEngineId(value: unknown): value is SearchEngineId {
  return SEARCH_ENGINES.some((engine) => engine.id === value)
}

export function getSearchEngine(id: SearchEngineId): SearchEngineOption {
  return SEARCH_ENGINES.find((engine) => engine.id === id) ?? SEARCH_ENGINES[0]
}

export function buildSearchUrl(engineId: Exclude<SearchEngineId, 'default'>, text: string): string {
  const targets: Record<Exclude<SearchEngineId, 'default'>, { url: string; parameter: string }> = {
    google: { url: 'https://www.google.com/search', parameter: 'q' },
    bing: { url: 'https://www.bing.com/search', parameter: 'q' },
    baidu: { url: 'https://www.baidu.com/s', parameter: 'wd' },
    duckduckgo: { url: 'https://duckduckgo.com/', parameter: 'q' },
  }
  const target = targets[engineId]
  const url = new URL(target.url)
  url.searchParams.set(target.parameter, text)
  return url.toString()
}
