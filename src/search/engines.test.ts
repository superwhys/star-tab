import { describe, expect, it } from 'vitest'
import { buildSearchUrl, getSearchEngine, isSearchEngineId } from './engines'

describe('search engines', () => {
  it('recognizes only supported engine ids', () => {
    expect(isSearchEngineId('google')).toBe(true)
    expect(isSearchEngineId('duckduckgo')).toBe(true)
    expect(isSearchEngineId('unknown')).toBe(false)
  })

  it('returns the configured engine metadata', () => {
    expect(getSearchEngine('baidu').name).toBe('百度')
    expect(getSearchEngine('default').description).toContain('Chrome')
  })

  it.each([
    ['google', 'https://www.google.com/search', 'q'],
    ['bing', 'https://www.bing.com/search', 'q'],
    ['baidu', 'https://www.baidu.com/s', 'wd'],
    ['duckduckgo', 'https://duckduckgo.com/', 'q'],
  ] as const)('builds an encoded %s search URL', (engineId, baseUrl, parameter) => {
    const result = new URL(buildSearchUrl(engineId, '星页 Vue 3'))

    expect(`${result.origin}${result.pathname}`).toBe(baseUrl)
    expect(result.searchParams.get(parameter)).toBe('星页 Vue 3')
  })
})
