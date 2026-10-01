/** Devuelve el enlace como URL http(s) válida, o null si no lo es. Añade `https://` si falta. */
export function normalizeHttpUrl(input: string): string | null {
  const text = input.trim()
  if (!text || /\s/.test(text)) return null

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(text)
  if (hasScheme && !/^https?:\/\//i.test(text)) return null

  try {
    const url = new URL(hasScheme ? text : `https://${text}`)
    if (!url.hostname.includes('.')) return null
    return url.href
  } catch {
    return null
  }
}
