import { describe, expect, it } from 'vitest'
import { resolveAccess } from './access'

const member = { role: 'member', status: 'approved' } as const
const leader = { role: 'leader', status: 'approved' } as const

describe('resolveAccess', () => {
  it('sin sesión manda a ingresar', () => {
    expect(resolveAccess({ hasSession: false, profile: null }, 'approved')).toBe('/ingresar')
    expect(resolveAccess({ hasSession: false, profile: null }, 'leader')).toBe('/ingresar')
  })

  it('pendiente o rechazado manda a la pantalla de espera', () => {
    expect(resolveAccess({ hasSession: true, profile: { role: 'member', status: 'pending' } }, 'approved')).toBe('/pendiente')
    expect(resolveAccess({ hasSession: true, profile: { role: 'member', status: 'rejected' } }, 'approved')).toBe('/pendiente')
  })

  it('un líder no aprobado no entra', () => {
    expect(resolveAccess({ hasSession: true, profile: { role: 'leader', status: 'rejected' } }, 'leader')).toBe('/pendiente')
  })

  it('sesión sin perfil se trata como no aprobado', () => {
    expect(resolveAccess({ hasSession: true, profile: null }, 'approved')).toBe('/pendiente')
  })

  it('miembro aprobado entra a la zona privada pero no al panel', () => {
    expect(resolveAccess({ hasSession: true, profile: member }, 'approved')).toBe('ok')
    expect(resolveAccess({ hasSession: true, profile: member }, 'leader')).toBe('/eventos')
  })

  it('líder entra a todo', () => {
    expect(resolveAccess({ hasSession: true, profile: leader }, 'approved')).toBe('ok')
    expect(resolveAccess({ hasSession: true, profile: leader }, 'leader')).toBe('ok')
  })
})
