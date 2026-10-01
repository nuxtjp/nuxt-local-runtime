const numericLoopbackHosts = new Set(['127.0.0.1', '[::1]'])

/**
 * DNS names are rejected so local routing cannot change after validation.
 */
export function requireLoopbackEndpoint(endpoint: string): URL {
  const url = new URL(endpoint)
  if (!['http:', 'https:'].includes(url.protocol)
    || !numericLoopbackHosts.has(url.hostname)
    || url.username
    || url.password
    || url.search
    || url.hash
    || (url.pathname !== '/' && url.pathname !== '')
  ) {
    throw new Error('local runtime endpoint must be a bare numeric loopback origin')
  }
  return url
}

export function runtimeUrl(endpoint: URL, path: string): URL {
  if (!path.startsWith('/') || path.includes('..')) {
    throw new Error('local runtime path is invalid')
  }
  return new URL(path, endpoint)
}
