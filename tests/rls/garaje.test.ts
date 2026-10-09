// Permisos de garaje (motos), anuncios, directorio y mapa de eventos.
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
let other: Actor
let leader: Actor
const userIds: string[] = []
let futureEventId: string

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

async function createActor(label: string, patch?: { status?: string; role?: string }): Promise<Actor> {
  const email = `gar-${label}-${run}@neutro.test`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `GAR ${label}`, nickname: label },
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
  other = await createActor('otro', { status: 'approved' })
  leader = await createActor('lider', { status: 'approved', role: 'leader' })
  // Ficha del miembro para que aparezca completo en el directorio
  await admin.from('applications').insert({
    profile_id: member.id,
    city: 'Medellín',
    occupation: 'Mecánico',
    birth_date: '1990-05-14',
    phone: '300 555 0101',
    blood_type: 'O+',
    emergency_contact_name: 'Ana',
    emergency_contact_phone: '300 000 0000',
  })
  const { data: event, error } = await admin
    .from('events')
    .insert({ title: `GAR evento ${run}`, starts_at: new Date(Date.now() + 86400000).toISOString() })
    .select('id')
    .single()
  if (error) throw error
  futureEventId = event.id
})

afterAll(async () => {
  for (const id of userIds) {
    const { data } = await admin.storage.from('motorcycles').list(id)
    if (data?.length) await admin.storage.from('motorcycles').remove(data.map((f) => `${id}/${f.name}`))
  }
  await admin.from('events').delete().like('title', `%${run}%`)
  await admin.from('announcements').delete().like('title', `%${run}%`)
  for (const id of userIds) await admin.auth.admin.deleteUser(id)
})

function expectBlockedRead(result: { data: unknown; error: unknown }) {
  if (result.error) return
  expect(result.data).toEqual([])
}

describe('motos (garaje)', () => {
  it('un miembro crea, edita y borra solo las suyas', async () => {
    const created = await member.client
      .from('motorcycles')
      .insert({ brand: 'Yamaha', model: 'MT-07', year: 2022, displacement_cc: 689 })
      .select('id, profile_id')
      .single()
    expect(created.error).toBeNull()
    expect(created.data!.profile_id).toBe(member.id)

    const updated = await member.client.from('motorcycles').update({ color: 'Azul' }).eq('id', created.data!.id)
    expect(updated.error).toBeNull()

    // Otro miembro no puede editar ni borrar la del miembro
    await other.client.from('motorcycles').update({ color: 'Hackeado' }).eq('id', created.data!.id)
    await other.client.from('motorcycles').delete().eq('id', created.data!.id)
    const check = await admin.from('motorcycles').select('color').eq('id', created.data!.id).single()
    expect(check.data!.color).toBe('Azul')

    const deleted = await member.client.from('motorcycles').delete().eq('id', created.data!.id).select('id')
    expect(deleted.data).toHaveLength(1)
  })

  it('un miembro aprobado lee las motos de otro; un pendiente no, pero sí las propias', async () => {
    const { data: m } = await admin.from('motorcycles').insert({ profile_id: member.id, brand: 'Honda', model: 'CB500' }).select('id').single()
    const { data: p } = await pending.client.from('motorcycles').insert({ brand: 'Suzuki', model: 'GN125' }).select('id').single()
    expect(p).not.toBeNull()

    const otherSeesMember = await other.client.from('motorcycles').select('id').eq('id', m!.id)
    expect(otherSeesMember.data).toHaveLength(1)

    const pendingSeesMember = await pending.client.from('motorcycles').select('id').eq('id', m!.id)
    expect(pendingSeesMember.data).toEqual([])

    const pendingSeesOwn = await pending.client.from('motorcycles').select('id').eq('id', p!.id)
    expect(pendingSeesOwn.data).toHaveLength(1)

    await admin.from('motorcycles').delete().in('id', [m!.id, p!.id])
  })

  it('no crea una moto a nombre de otro', async () => {
    const forged = await member.client.from('motorcycles').insert({ profile_id: other.id, brand: 'x', model: 'y' })
    expect(forged.error).not.toBeNull()
  })

  it('anónimo no lee motos', async () => {
    expectBlockedRead(await anon.from('motorcycles').select('*'))
  })

  it('la foto se sube a la carpeta propia, no a la de otro', async () => {
    const own = await member.client.storage.from('motorcycles').upload(`${member.id}/moto.png`, png, { contentType: 'image/png' })
    expect(own.error).toBeNull()
    const other2 = await member.client.storage.from('motorcycles').upload(`${other.id}/intruso.png`, png, { contentType: 'image/png' })
    expect(other2.error).not.toBeNull()
    await member.client.storage.from('motorcycles').remove([`${member.id}/moto.png`])
  })
})

describe('directorio de miembros', () => {
  it('un aprobado obtiene filas con solo columnas seguras y sin año de nacimiento', async () => {
    const { data, error } = await member.client.rpc('member_directory')
    expect(error).toBeNull()
    const me = (data as Record<string, unknown>[]).find((r) => r.profile_id === member.id)
    expect(me).toBeTruthy()
    expect(Object.keys(me!).sort()).toEqual(
      ['avatar_path', 'birth_day', 'birth_month', 'city', 'full_name', 'nickname', 'occupation', 'phone', 'profile_id'].sort(),
    )
    expect(me!.city).toBe('Medellín')
    expect(me!.phone).toBe('300 555 0101')
    expect(me!.birth_month).toBe(5)
    expect(me!.birth_day).toBe(14)
    expect('birth_date' in me!).toBe(false)
  })

  it('un pendiente y un anónimo obtienen vacío', async () => {
    const asPending = await pending.client.rpc('member_directory')
    expect(asPending.data).toEqual([])
    const asAnon = await anon.rpc('member_directory')
    // anon no tiene permiso de ejecución: error o vacío
    if (!asAnon.error) expect(asAnon.data).toEqual([])
  })
})

describe('anuncios', () => {
  it('un líder crea, fija y borra; un miembro lee pero no escribe; un anónimo no lee', async () => {
    const created = await leader.client
      .from('announcements')
      .insert({ title: `GAR aviso ${run}`, body: 'Rodada este domingo', pinned: true })
      .select('id')
      .single()
    expect(created.error).toBeNull()

    const read = await member.client.from('announcements').select('id, title').eq('id', created.data!.id)
    expect(read.data).toHaveLength(1)

    const memberWrite = await member.client.from('announcements').insert({ title: 'colado', body: 'x' })
    expect(memberWrite.error).not.toBeNull()

    expectBlockedRead(await anon.from('announcements').select('*'))
    expectBlockedRead(await pending.client.from('announcements').select('*'))

    const unpinned = await leader.client.from('announcements').update({ pinned: false }).eq('id', created.data!.id)
    expect(unpinned.error).toBeNull()
    const deleted = await leader.client.from('announcements').delete().eq('id', created.data!.id).select('id')
    expect(deleted.data).toHaveLength(1)
  })
})

describe('mapa del evento', () => {
  it('un miembro no escribe meeting_point; un líder sí', async () => {
    await member.client.from('events').update({ meeting_point: 'Hackeado' }).eq('id', futureEventId)
    const after = await admin.from('events').select('meeting_point').eq('id', futureEventId).single()
    expect(after.data!.meeting_point).toBe('')

    const ok = await leader.client
      .from('events')
      .update({ meeting_point: 'Estación de servicio', map_url: 'https://maps.google.com/?q=x' })
      .eq('id', futureEventId)
    expect(ok.error).toBeNull()
  })

  it('rechaza un map_url que no sea http(s)', async () => {
    const bad = await leader.client.from('events').update({ map_url: 'javascript:alert(1)' }).eq('id', futureEventId)
    expect(bad.error).not.toBeNull()
  })
})
