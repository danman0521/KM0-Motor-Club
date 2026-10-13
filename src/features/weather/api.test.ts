import { describe, expect, it } from 'vitest'
import { forecastableDate, weatherText } from './api'

describe('weatherText', () => {
  it('traduce códigos WMO a español', () => {
    expect(weatherText(0)).toBe('Despejado')
    expect(weatherText(3)).toBe('Nublado')
    expect(weatherText(61)).toBe('Lluvia')
    expect(weatherText(95)).toBe('Tormenta')
    expect(weatherText(73)).toBe('Nieve')
  })

  it('usa un texto por defecto para códigos desconocidos', () => {
    expect(weatherText(999)).toBe('Sin datos')
  })
})

describe('forecastableDate', () => {
  const now = new Date('2026-10-12T09:00:00')

  it('devuelve la fecha de un evento dentro del rango de pronóstico', () => {
    expect(forecastableDate('2026-10-14T18:00:00', now)).toBe('2026-10-14')
  })

  it('incluye hoy mismo', () => {
    expect(forecastableDate('2026-10-12T20:00:00', now)).toBe('2026-10-12')
  })

  it('devuelve null para un evento pasado', () => {
    expect(forecastableDate('2026-10-10T18:00:00', now)).toBeNull()
  })

  it('devuelve null para un evento a más de 16 días', () => {
    expect(forecastableDate('2026-11-05T18:00:00', now)).toBeNull()
  })

  it('devuelve null si la fecha es inválida', () => {
    expect(forecastableDate('no-es-fecha', now)).toBeNull()
  })
})
