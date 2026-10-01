const ID = /^[A-Za-z0-9_-]{11}$/
const HOSTS = new Set(['youtube.com', 'youtube-nocookie.com', 'youtu.be'])
const PATH_PREFIXES = ['shorts', 'embed', 'live']

/** Extrae el id de un enlace de YouTube; null si el enlace no es válido. */
export function parseYouTubeId(input: string): string | null {
  const text = input.trim()
  if (!text) return null

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '')
  if (!HOSTS.has(host)) return null

  const segments = url.pathname.split('/').filter(Boolean)
  let id: string | null | undefined
  if (host === 'youtu.be') {
    id = segments[0]
  } else if (segments[0] === 'watch') {
    id = url.searchParams.get('v')
  } else if (PATH_PREFIXES.includes(segments[0])) {
    id = segments[1]
  }

  return id && ID.test(id) ? id : null
}

export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}
