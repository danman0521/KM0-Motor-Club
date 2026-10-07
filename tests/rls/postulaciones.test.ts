// Permisos de la ficha de postulación: cada quien ve y edita la suya (también
// antes de estar aprobado); los líderes ven todas; nadie más.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error módulo JS sin tipos
import { readSupabaseEnv } from '../../scripts/supabase-env.mjs'

const env = readSupabaseEnv() as { url: string; anonKey: string; serviceKey: string }
const run = Date.now()
const password = `Prueba-${run}-x`
const noSession = { auth: { persistSession: false, autoRefreshToken: false } }

const admin = createClient(env.url, env.serviceKey, noSession)
const anon = createClient(env.url, env.anonKey, noSession)

type Actor = { id: string; client: SupabaseClient }
let pending: Actor
let member: Actor
let leader: Actor
const userIds: string[] = []

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

const baseApplication = {
  city: 'Medellín',
  occupation: 'Mecánico',
  birth_date: '1990-05-20',
  blood_type: 'O+',
  emergency_contact_name: 'Marta Díaz',
  emergency_contact_phone: '300 000 0000',
}

async function createActor(label: string, patch?: { status?: string; role?: string }): Promise<Actor> {
  const email = `app-${label}-${run}@neutro.test`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `APP ${label}` },
  })
  if (error) throw error
  const id = data.user.id
  userIds.push(id)
  if (patch) {
    const { error: e } = await admin.from('profiles').update(patch).eq('id', id)
    if (e) throw e
  }
  const client = createClient(env.url, env.anonKey, noSession)
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  return { id, client }
}

beforeAll(async () => {
  pending = await createActor('pendiente')
  member = await createActor('miembro', { status: 'approved' })
  leader = await createActor('lider', { status: 'approved', role: 'leader' })
})

afterAll(async () => {
  for (const bucket of ['applications', 'avatars']) {
    for (const id of userIds) {
      const { data } = await admin.storage.from(bucket).list(id)
      if (data?.length) await admin.storage.from(bucket).remove(data.map((f) => `${id}/${f.name}`))
    }
  }
  for (const id of userIds) await admin.auth.admin.deleteUser(id)
})

describe('ficha de postulación', () => {
  it('un visitante no lee fichas', async () => {
    const result = await anon.from('applications').select('*')
    if (!result.error) expect(result.data).toEqual([])
  })

  it('una cuenta pendiente crea su ficha y la actualiza', async () => {
    const created = await pending.client.from('applications').insert(baseApplication).select('profile_id, city').single()
    expect(created.error).toBeNull()
    expect(created.data).toEqual({ profile_id: pending.id, city: 'Medellín' })

    const updated = await pending.client
      .from('applications')
      .update({ allergies: 'Penicilina' })
      .eq('profile_id', pending.id)
      .select('allergies')
      .single()
    expect(updated.data!.allergies).toBe('Penicilina')
  })

  it('no crea una ficha a nombre de otro', async () => {
    const forged = await member.client.from('applications').insert({ ...baseApplication, profile_id: pending.id })
    expect(forged.error).not.toBeNull()
  })

  it('un miembro no ve la ficha de otro ni la modifica', async () => {
    const { data } = await member.client.from('applications').select('profile_id').eq('profile_id', pending.id)
    expect(data).toEqual([])
    await member.client.from('applications').update({ city: 'Hackeado' }).eq('profile_id', pending.id)
    const check = await admin.from('applications').select('city').eq('profile_id', pending.id).single()
    expect(check.data!.city).toBe('Medellín')
  })

  it('un líder ve todas las fichas', async () => {
    const { data } = await leader.client.from('applications').select('profile_id, blood_type, emergency_contact_name')
    expect(data!.find((a) => a.profile_id === pending.id)).toEqual({
      profile_id: pending.id,
      blood_type: 'O+',
      emergency_contact_name: 'Marta Díaz',
    })
  })

  it.each([
    ['sin ciudad', { city: '' }],
    ['sin contacto de emergencia', { emergency_contact_name: '' }],
    ['con tipo de sangre inválido', { blood_type: 'Z+' }],
    ['con fecha de nacimiento futura', { birth_date: '2099-01-01' }],
  ])('rechaza una ficha %s', async (_label, patch) => {
    const result = await member.client.from('applications').insert({ ...baseApplication, ...patch })
    expect(result.error).not.toBeNull()
  })

  it('la foto de la moto se sube a la propia carpeta; la ve el dueño y el líder, no otro miembro', async () => {
    const path = `${pending.id}/moto.png`
    const up = await pending.client.storage.from('applications').upload(path, png, { contentType: 'image/png' })
    expect(up.error).toBeNull()
    const intruder = await member.client.storage
      .from('applications')
      .upload(`${pending.id}/intruso.png`, png, { contentType: 'image/png' })
    expect(intruder.error).not.toBeNull()

    const saved = await pending.client.from('applications').update({ moto_photo_path: path }).eq('profile_id', pending.id)
    expect(saved.error).toBeNull()
    const wrong = await pending.client
      .from('applications')
      .update({ moto_photo_path: `${member.id}/x.png` })
      .eq('profile_id', pending.id)
    expect(wrong.error).not.toBeNull()

    const owner = await pending.client.storage.from('applications').createSignedUrl(path, 60)
    expect(owner.error).toBeNull()
    const asLeader = await leader.client.storage.from('applications').createSignedUrl(path, 60)
    expect(asLeader.error).toBeNull()
    const asMember = await member.client.storage.from('applications').createSignedUrl(path, 60)
    expect(asMember.error).not.toBeNull()
  })

  it('una cuenta pendiente ya puede subir su foto de perfil', async () => {
    const path = `${pending.id}/perfil.png`
    const up = await pending.client.storage.from('avatars').upload(path, png, { contentType: 'image/png' })
    expect(up.error).toBeNull()
    const saved = await pending.client.from('profiles').update({ avatar_path: path }).eq('id', pending.id)
    expect(saved.error).toBeNull()
    const other = await pending.client.storage
      .from('avatars')
      .upload(`${member.id}/intruso.png`, png, { contentType: 'image/png' })
    expect(other.error).not.toBeNull()
  })
})
