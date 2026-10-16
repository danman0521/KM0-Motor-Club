import { describe, expect, it } from 'vitest'
import type { Profile } from '../../lib/supabase'
import type { Application } from '../applications/api'
import type { Motorcycle } from '../motorcycles/api'
import { buildMemberRows, EXPORT_HEADERS } from './export'

const profiles = [
  { id: 'p1', full_name: 'Ana Gómez', nickname: 'Chispa', role: 'member', status: 'approved', ride_role: 'piloto', created_at: '2026-01-15T10:00:00Z' },
  { id: 'p2', full_name: 'Luis Soto', nickname: null, role: 'leader', status: 'approved', ride_role: 'copiloto', created_at: '2026-02-20T10:00:00Z' },
] as unknown as Profile[]

const applications = [
  {
    profile_id: 'p1',
    city: 'Medellín',
    occupation: 'Mecánica',
    birth_date: '1990-05-10',
    phone: '300 111 2222',
    other_club: '',
    blood_type: 'O+',
    allergies: 'Ninguna',
    medical_conditions: '',
    emergency_contact_name: 'Marta',
    emergency_contact_phone: '301 000 0000',
  },
] as unknown as Application[]

const motorcycles = [
  { profile_id: 'p1', brand: 'Yamaha', model: 'MT-07' },
  { profile_id: 'p1', brand: 'Honda', model: 'CB500' },
] as unknown as Motorcycle[]

describe('buildMemberRows', () => {
  const rows = buildMemberRows(profiles, applications, motorcycles)

  it('empieza por la cabecera y una fila por miembro', () => {
    expect(rows[0]).toEqual(EXPORT_HEADERS)
    expect(rows).toHaveLength(3)
  })

  it('combina perfil, ficha y motos del miembro', () => {
    const ana = rows[1]
    expect(ana[0]).toBe('Ana Gómez')
    expect(ana[2]).toBe('Piloto')
    expect(ana[3]).toBe('Aprobado')
    expect(ana[4]).toBe('No')
    expect(ana[5]).toBe('Medellín')
    expect(ana[11]).toBe('O+')
    expect(ana[16]).toBe('Yamaha MT-07; Honda CB500')
  })

  it('deja vacíos los datos de ficha de quien no la tiene', () => {
    const luis = rows[2]
    expect(luis[0]).toBe('Luis Soto')
    expect(luis[2]).toBe('Copiloto')
    expect(luis[4]).toBe('Sí')
    expect(luis[5]).toBe('')
    expect(luis[16]).toBe('')
  })
})
