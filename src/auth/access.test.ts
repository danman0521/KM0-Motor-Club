import { describe, expect, it } from 'vitest'
import { pendingRedirect, resolveAccess } from './access'

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

describe('pendingRedirect', () => {
  const pending = { role: 'member', status: 'pending' } as const
  const rejected = { role: 'member', status: 'rejected' } as const

  it('sin sesión no redirige a nada', () => {
    expect(pendingRedirect({ hasSession: false, profile: null }, '/')).toBeNull()
    expect(pendingRedirect({ hasSession: false, profile: null }, '/ingresar')).toBeNull()
  })

  it('con sesión pero sin perfil cargado no redirige', () => {
    expect(pendingRedirect({ hasSession: true, profile: null }, '/')).toBeNull()
  })

  it('pendiente o rechazado solo puede ver la pantalla de espera', () => {
    expect(pendingRedirect({ hasSession: true, profile: pending }, '/')).toBe('/pendiente')
    expect(pendingRedirect({ hasSession: true, profile: pending }, '/eventos')).toBe('/pendiente')
    expect(pendingRedirect({ hasSession: true, profile: rejected }, '/registro')).toBe('/pendiente')
    expect(pendingRedirect({ hasSession: true, profile: pending }, '/pendiente')).toBeNull()
  })

  it('aprobado se queda donde está', () => {
    expect(pendingRedirect({ hasSession: true, profile: member }, '/')).toBeNull()
    expect(pendingRedirect({ hasSession: true, profile: leader }, '/lider')).toBeNull()
  })
})
