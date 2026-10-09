import { describe, expect, it } from 'vitest'
import { ageFrom, buildMonthGrid, formatDayMonth, isPast, isSameDay, monthStart, toLocalInputValue } from './dates'

describe('buildMonthGrid', () => {
  it('cubre el mes con semanas completas de lunes a domingo', () => {
    // Octubre de 2026 empieza en jueves y termina en sábado
    const grid = buildMonthGrid(2026, 9)
    expect(grid).toHaveLength(5)
    for (const week of grid) {
      expect(week).toHaveLength(7)
      expect(week[0].getDay()).toBe(1)
      expect(week[6].getDay()).toBe(0)
    }
    expect(grid[0][0].getDate()).toBe(28) // lunes 28 de septiembre
    expect(grid[0][3].getDate()).toBe(1)
    expect(grid[0][3].getMonth()).toBe(9)
    expect(grid[4][6].getDate()).toBe(1) // domingo 1 de noviembre
  })

  it('un mes que empieza en lunes no añade semana previa', () => {
    // Junio de 2026 empieza en lunes
    const grid = buildMonthGrid(2026, 5)
    expect(grid[0][0].getDate()).toBe(1)
    expect(grid[0][0].getMonth()).toBe(5)
  })

  it('un mes que empieza en domingo ocupa seis semanas si hace falta', () => {
    // Marzo de 2026 empieza en domingo y tiene 31 días
    const grid = buildMonthGrid(2026, 2)
    expect(grid).toHaveLength(6)
    expect(grid[0][6].getDate()).toBe(1)
  })

  it('febrero no bisiesto que empieza en lunes ocupa cuatro semanas', () => {
    const grid = buildMonthGrid(2027, 1)
    expect(grid).toHaveLength(4)
  })
})

describe('isPast', () => {
  const now = new Date('2026-10-01T12:00:00Z')
  it('distingue pasado y futuro', () => {
    expect(isPast('2026-10-01T11:59:00Z', now)).toBe(true)
    expect(isPast('2026-10-01T12:01:00Z', now)).toBe(false)
  })
})

describe('isSameDay', () => {
  it('compara solo año, mes y día', () => {
    expect(isSameDay(new Date(2026, 9, 1, 8), new Date(2026, 9, 1, 23))).toBe(true)
    expect(isSameDay(new Date(2026, 9, 1), new Date(2026, 9, 2))).toBe(false)
    expect(isSameDay(new Date(2026, 9, 1), new Date(2025, 9, 1))).toBe(false)
  })
})

describe('monthStart', () => {
  it('devuelve el primer día del mes en formato de fecha', () => {
    expect(monthStart(new Date(2026, 9, 17))).toBe('2026-10-01')
    expect(monthStart(new Date(2026, 0, 31))).toBe('2026-01-01')
  })
})

describe('toLocalInputValue', () => {
  it('convierte a formato de <input type="datetime-local"> en hora local', () => {
    const local = new Date(2026, 9, 5, 7, 30)
    expect(toLocalInputValue(local.toISOString())).toBe('2026-10-05T07:30')
  })
})

describe('ageFrom', () => {
  const now = new Date(2026, 9, 7) // 7 de octubre de 2026
  it('resta un año si aún no ha cumplido', () => {
    expect(ageFrom('1990-05-20', now)).toBe(36)
    expect(ageFrom('1990-12-20', now)).toBe(35)
    expect(ageFrom('2010-10-07', now)).toBe(16)
    expect(ageFrom('2010-10-08', now)).toBe(15)
  })
})

describe('formatDayMonth', () => {
  it('formatea día y mes en español, sin año', () => {
    expect(formatDayMonth(5, 14)).toBe('14 de mayo')
    expect(formatDayMonth(1, 1)).toBe('1 de enero')
    expect(formatDayMonth(12, 31)).toBe('31 de diciembre')
  })
})
