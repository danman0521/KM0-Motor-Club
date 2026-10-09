const pad = (n: number) => String(n).padStart(2, '0')

/** Semanas (lunes a domingo) que cubren el mes indicado. `monthIndex` va de 0 a 11. */
export function buildMonthGrid(year: number, monthIndex: number): Date[][] {
  const first = new Date(year, monthIndex, 1)
  const last = new Date(year, monthIndex + 1, 0)
  const offset = (first.getDay() + 6) % 7 // días desde el lunes anterior
  const weeks: Date[][] = []
  const cursor = new Date(year, monthIndex, 1 - offset)
  while (cursor <= last) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export function isPast(startsAt: string, now: Date = new Date()): boolean {
  return new Date(startsAt).getTime() < now.getTime()
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Primer día del mes como fecha `YYYY-MM-01` (clave de `featured_riders.month`). */
export function monthStart(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

/** Valor para `<input type="datetime-local">` en hora local. */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const eventFormat = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const dayFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })

export function formatEventDate(iso: string): string {
  return eventFormat.format(new Date(iso))
}

/** Día (sin hora) de un instante, en hora local. */
export function formatDayOf(iso: string): string {
  return dayFormat.format(new Date(iso))
}

/** Formatea una fecha sin hora (`YYYY-MM-DD`) sin desplazarla por zona horaria. */
export function formatDay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return dayFormat.format(new Date(y, m - 1, d))
}

export function formatMonth(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number)
  return monthFormat.format(new Date(y, m - 1, 1))
}

/** Edad cumplida a partir de una fecha `YYYY-MM-DD`. */
export function ageFrom(birthDate: string, now: Date = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number)
  let age = now.getFullYear() - y
  const beforeBirthday = now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)
  if (beforeBirthday) age -= 1
  return age
}

const dayMonthFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' })

/** "14 de mayo" a partir de mes (1–12) y día. Para cumpleaños, sin año. */
export function formatDayMonth(month: number, day: number): string {
  return dayMonthFormat.format(new Date(2000, month - 1, day))
}
