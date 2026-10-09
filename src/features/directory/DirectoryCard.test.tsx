import { describe, expect, it } from 'vitest'
import { whatsappLink } from './api'

describe('whatsappLink', () => {
  it('deja solo dígitos para wa.me', () => {
    expect(whatsappLink('300 555-0101')).toBe('https://wa.me/3005550101')
    expect(whatsappLink('+57 (300) 555 0101')).toBe('https://wa.me/573005550101')
  })

  it('sin teléfono devuelve null', () => {
    expect(whatsappLink('')).toBeNull()
    expect(whatsappLink('   ')).toBeNull()
  })
})
