import { describe, expect, it } from 'vitest'
import { normalizeHttpUrl } from './url'

describe('normalizeHttpUrl', () => {
  it.each([
    ['https://ejemplo.com', 'https://ejemplo.com/'],
    ['http://ejemplo.com/ruta?x=1', 'http://ejemplo.com/ruta?x=1'],
    ['  https://ejemplo.com/a  ', 'https://ejemplo.com/a'],
    ['ejemplo.com', 'https://ejemplo.com/'],
    ['www.taller-lobo.co/promos', 'https://www.taller-lobo.co/promos'],
  ])('acepta %s', (input, expected) => {
    expect(normalizeHttpUrl(input)).toBe(expected)
  })

  it.each([[''], ['   '], ['javascript:alert(1)'], ['mailto:a@b.co'], ['ftp://ejemplo.com'], ['sin espacios validos .com'], ['hola']])(
    'rechaza %s',
    (input) => {
      expect(normalizeHttpUrl(input)).toBeNull()
    },
  )
})
