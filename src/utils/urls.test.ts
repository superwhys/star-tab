import { describe, expect, it } from 'vitest'
import { normalizeDirectUrl } from './urls'

describe('URL utilities', () => {
  it('normalizes domains and complete web URLs', () => {
    expect(normalizeDirectUrl('example.com/docs?q=1')).toBe('https://example.com/docs?q=1')
    expect(normalizeDirectUrl('https://www.example.com/a')).toBe('https://www.example.com/a')
    expect(normalizeDirectUrl('localhost:5173/test')).toBe('http://localhost:5173/test')
  })

  it('does not treat regular searches or unsafe protocols as URLs', () => {
    expect(normalizeDirectUrl('Vue 3 documentation')).toBeUndefined()
    expect(normalizeDirectUrl('name@example.com')).toBeUndefined()
    expect(normalizeDirectUrl('javascript:alert(1)')).toBeUndefined()
    expect(normalizeDirectUrl('data:text/html,hello')).toBeUndefined()
  })
})
