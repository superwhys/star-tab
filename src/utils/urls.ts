const WEB_PROTOCOLS = new Set(['http:', 'https:'])

export function normalizeDirectUrl(value: string): string | undefined {
  const input = value.trim()
  if (!input || /\s/.test(input)) return undefined

  const local = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:[/?#]|$)/i.test(input)
  const protocolMatch = input.match(/^([a-z][a-z\d+.-]*):\/\//i)
  const hasProtocol = Boolean(protocolMatch)
  if (!hasProtocol && /^[a-z][a-z\d+.-]*:/i.test(input) && !local) return undefined
  if (!hasProtocol && input.includes('@')) return undefined

  const candidate = hasProtocol ? input : `${local ? 'http' : 'https'}://${input}`

  try {
    const url = new URL(candidate)
    if (!WEB_PROTOCOLS.has(url.protocol)) return undefined
    if (!isDirectHostname(url.hostname)) return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function isDirectHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '::1') return true
  if (/^127(?:\.\d{1,3}){3}$/.test(hostname)) return true
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return hostname.split('.').every((part) => Number(part) <= 255)
  }

  const labels = hostname.split('.')
  return labels.length >= 2 && labels.every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label))
}
