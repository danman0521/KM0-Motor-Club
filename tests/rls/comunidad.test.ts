// Permisos de la fase 2: foto de perfil, asistencia, calificaciones,
// comentarios y convenios. Corre contra Supabase local.
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

let pastEventId: string
let futureEventId: string
let activePartnerId: string

// PNG de 1x1 píxel
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

async function createActor(label: string, patch?: { status?: string; role?: string }): Promise<Actor> {
  const email = `com-${label}-${run}@neutro.test`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `COM ${label}` },
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

  const day = 24 * 60 * 60 * 1000
  const { data: events, error } = await admin
    .from('events')
    .insert([
      { title: `COM pasado ${run}`, starts_at: new Date(Date.now() - 10 * day).toISOString() },
      { title: `COM futuro ${run}`, starts_at: new Date(Date.now() + 10 * day).toISOString() },
    ])
    .select('id, title')
  if (error) throw error
  pastEventId = events.find((e) => e.title.includes('pasado'))!.id
  futureEventId = events.find((e) => e.title.includes('futuro'))!.id

  const { data: partners, error: partnerError } = await admin
    .from('partners')
    .insert([
      // En inserciones múltiples las claves ausentes se envían como null: se dan todas
      { name: `COM activo ${run}`, benefit: '10 % en repuestos', active: true, valid_until: null },
      { name: `COM inactivo ${run}`, benefit: 'Nada', active: false, valid_until: null },
      { name: `COM vencido ${run}`, benefit: 'Ya no', active: true, valid_until: '2020-01-01' },
    ])
    .select('id, name')
  if (partnerError) throw partnerError
  activePartnerId = partners.find((p) => p.name.includes('activo') && !p.name.includes('inactivo'))!.id
})

afterAll(async () => {
  for (const id of userIds) {
    const { data } = await admin.storage.from('avatars').list(id)
    if (data?.length) await admin.storage.from('avatars').remove(data.map((f) => `${id}/${f.name}`))
  }
  await admin.from('events').delete().like('title', `%${run}%`)
  await admin.from('partners').delete().like('name', `%${run}%`)
  for (const id of userIds) await admin.auth.admin.deleteUser(id)
})

function expectBlockedRead(result: { data: unknown; error: unknown }) {
  if (result.error) return
  expect(result.data).toEqual([])
}

describe('visitante y pendiente', () => {
  it.each(['event_attendance', 'event_ratings', 'event_comments', 'partners'])('no leen %s', async (table) => {
    expectBlockedRead(await anon.from(table).select('*'))
    expectBlockedRead(await pending.client.from(table).select('*'))
  })

  it('un pendiente no confirma, califica ni comenta', async () => {
    const going = await pending.client.from('event_attendance').insert({ event_id: futureEventId, status: 'going' })
    expect(going.error).not.toBeNull()
    const rating = await pending.client.from('event_ratings').insert({ event_id: pastEventId, stars: 5 })
    expect(rating.error).not.toBeNull()
    const comment = await pending.client.from('event_comments').insert({ event_id: pastEventId, body: 'hola' })
    expect(comment.error).not.toBeNull()
  })

  it('un pendiente sí sube su foto de perfil (la pide la ficha de postulación), pero solo a su carpeta', async () => {
    const own = await pending.client.storage
      .from('avatars')
      .upload(`${pending.id}/foto.png`, png, { contentType: 'image/png' })
    expect(own.error).toBeNull()
    const other = await pending.client.storage
      .from('avatars')
      .upload(`${member.id}/intruso.png`, png, { contentType: 'image/png' })
    expect(other.error).not.toBeNull()
  })
})

describe('foto de perfil', () => {
  it('un miembro sube su foto a su carpeta y la guarda en su perfil', async () => {
    const path = `${member.id}/foto.png`
    const up = await member.client.storage.from('avatars').upload(path, png, { contentType: 'image/png' })
    expect(up.error).toBeNull()
    const saved = await member.client.from('profiles').update({ avatar_path: path }).eq('id', member.id)
    expect(saved.error).toBeNull()
    const { data } = await other.client.from('profiles').select('avatar_path').eq('id', member.id).single()
    expect(data!.avatar_path).toBe(path)
  })

  it('no sube a la carpeta de otro ni apunta su perfil a la foto de otro', async () => {
    const up = await member.client.storage
      .from('avatars')
      .upload(`${other.id}/intruso.png`, png, { contentType: 'image/png' })
    expect(up.error).not.toBeNull()
    const saved = await member.client.from('profiles').update({ avatar_path: `${other.id}/x.png` }).eq('id', member.id)
    expect(saved.error).not.toBeNull()
  })

  it('no borra la foto de otro; el líder sí puede', async () => {
    const path = `${member.id}/foto.png`
    await other.client.storage.from('avatars').remove([path])
    const still = await admin.storage.from('avatars').list(member.id)
    expect(still.data!.map((f) => f.name)).toContain('foto.png')

    const rm = await leader.client.storage.from('avatars').remove([path])
    expect(rm.error).toBeNull()
    const gone = await admin.storage.from('avatars').list(member.id)
    expect(gone.data!.map((f) => f.name)).not.toContain('foto.png')
  })

  it('rechaza archivos que no son imágenes', async () => {
    const up = await member.client.storage
      .from('avatars')
      .upload(`${member.id}/nota.txt`, Buffer.from('hola'), { contentType: 'text/plain' })
    expect(up.error).not.toBeNull()
  })
})

describe('asistencia', () => {
  it('un miembro confirma y cambia su asistencia a un evento próximo', async () => {
    const going = await member.client.from('event_attendance').upsert({ event_id: futureEventId, status: 'going' })
    expect(going.error).toBeNull()
    const change = await member.client.from('event_attendance').upsert({ event_id: futureEventId, status: 'not_going' })
    expect(change.error).toBeNull()
    const { data } = await other.client.from('event_attendance').select('profile_id, status').eq('event_id', futureEventId)
    expect(data).toEqual([{ profile_id: member.id, status: 'not_going' }])
  })

  it('no confirma por otro miembro ni modifica la asistencia de otro', async () => {
    const forged = await member.client
      .from('event_attendance')
      .insert({ event_id: futureEventId, profile_id: other.id, status: 'going' })
    expect(forged.error).not.toBeNull()

    await other.client.from('event_attendance').update({ status: 'going' }).eq('profile_id', member.id)
    await other.client.from('event_attendance').delete().eq('profile_id', member.id)
    const { data } = await admin
      .from('event_attendance')
      .select('status')
      .eq('event_id', futureEventId)
      .eq('profile_id', member.id)
      .single()
    expect(data!.status).toBe('not_going')
  })

  it('no confirma asistencia a un evento que ya empezó', async () => {
    const late = await member.client.from('event_attendance').insert({ event_id: pastEventId, status: 'going' })
    expect(late.error).not.toBeNull()
  })

  it('rechaza un estado desconocido', async () => {
    const bad = await other.client.from('event_attendance').insert({ event_id: futureEventId, status: 'maybe' })
    expect(bad.error).not.toBeNull()
  })
})

describe('calificaciones', () => {
  it('un miembro califica un evento realizado y puede cambiar su nota', async () => {
    const first = await member.client.from('event_ratings').upsert({ event_id: pastEventId, stars: 4 })
    expect(first.error).toBeNull()
    const second = await member.client.from('event_ratings').upsert({ event_id: pastEventId, stars: 5 })
    expect(second.error).toBeNull()
    const { data } = await other.client.from('event_ratings').select('profile_id, stars').eq('event_id', pastEventId)
    expect(data).toEqual([{ profile_id: member.id, stars: 5 }])
  })

  it('no califica un evento que aún no empieza', async () => {
    const early = await member.client.from('event_ratings').insert({ event_id: futureEventId, stars: 5 })
    expect(early.error).not.toBeNull()
  })

  it.each([0, 6, -1])('rechaza %i estrellas', async (stars) => {
    const bad = await other.client.from('event_ratings').insert({ event_id: pastEventId, stars })
    expect(bad.error).not.toBeNull()
  })

  it('no califica por otro ni cambia la nota de otro', async () => {
    const forged = await member.client.from('event_ratings').insert({ event_id: pastEventId, profile_id: other.id, stars: 1 })
    expect(forged.error).not.toBeNull()
    await other.client.from('event_ratings').update({ stars: 1 }).eq('profile_id', member.id)
    const { data } = await admin
      .from('event_ratings')
      .select('stars')
      .eq('event_id', pastEventId)
      .eq('profile_id', member.id)
      .single()
    expect(data!.stars).toBe(5)
  })
})

describe('comentarios', () => {
  let commentId: string

  it('un miembro comenta a su nombre un evento realizado', async () => {
    const past = await member.client
      .from('event_comments')
      .insert({ event_id: pastEventId, body: 'Gran rodada' })
      .select('id, author_id')
      .single()
    expect(past.error).toBeNull()
    expect(past.data!.author_id).toBe(member.id)
    commentId = past.data!.id
  })

  it('no comenta un evento que aún no empieza', async () => {
    const early = await member.client.from('event_comments').insert({ event_id: futureEventId, body: '¿A qué hora salimos?' })
    expect(early.error).not.toBeNull()
  })

  it('no comenta a nombre de otro, ni vacío, ni demasiado largo', async () => {
    const forged = await member.client.from('event_comments').insert({ event_id: pastEventId, author_id: other.id, body: 'x' })
    expect(forged.error).not.toBeNull()
    const empty = await member.client.from('event_comments').insert({ event_id: pastEventId, body: '   ' })
    expect(empty.error).not.toBeNull()
    const long = await member.client.from('event_comments').insert({ event_id: pastEventId, body: 'a'.repeat(1001) })
    expect(long.error).not.toBeNull()
  })

  it('otro miembro no puede editarlo ni borrarlo', async () => {
    await other.client.from('event_comments').update({ body: 'cambiado' }).eq('id', commentId)
    await other.client.from('event_comments').delete().eq('id', commentId)
    const { data } = await admin.from('event_comments').select('body').eq('id', commentId).single()
    expect(data!.body).toBe('Gran rodada')
  })

  it('el autor borra el suyo y el líder borra cualquiera', async () => {
    const mine = await member.client.from('event_comments').delete().eq('id', commentId).select('id')
    expect(mine.data).toHaveLength(1)

    const { data: another } = await member.client
      .from('event_comments')
      .insert({ event_id: pastEventId, body: 'Fuera de lugar' })
      .select('id')
      .single()
    const moderated = await leader.client.from('event_comments').delete().eq('id', another!.id).select('id')
    expect(moderated.data).toHaveLength(1)
  })
})

describe('convenios', () => {
  it('un miembro ve solo los activos y vigentes', async () => {
    const { data } = await member.client.from('partners').select('name').like('name', `%${run}%`)
    expect(data!.map((p) => p.name)).toEqual([`COM activo ${run}`])
  })

  it('un miembro no crea, edita ni borra convenios', async () => {
    const ins = await member.client.from('partners').insert({ name: 'colado', benefit: 'x' })
    expect(ins.error).not.toBeNull()
    await member.client.from('partners').update({ benefit: 'hackeado' }).eq('id', activePartnerId)
    await member.client.from('partners').delete().eq('id', activePartnerId)
    const { data } = await admin.from('partners').select('benefit').eq('id', activePartnerId).single()
    expect(data!.benefit).toBe('10 % en repuestos')
  })

  it('un líder ve todos y los gestiona', async () => {
    const { data } = await leader.client.from('partners').select('name').like('name', `%${run}%`)
    expect(data).toHaveLength(3)

    const created = await leader.client
      .from('partners')
      .insert({ name: `COM del líder ${run}`, benefit: '2x1 en lavado', website: 'https://ejemplo.com' })
      .select('id')
      .single()
    expect(created.error).toBeNull()
    const updated = await leader.client.from('partners').update({ active: false }).eq('id', created.data!.id)
    expect(updated.error).toBeNull()
    const deleted = await leader.client.from('partners').delete().eq('id', created.data!.id).select('id')
    expect(deleted.data).toHaveLength(1)
  })

  it('rechaza un sitio web que no sea http(s)', async () => {
    const bad = await leader.client
      .from('partners')
      .insert({ name: `COM malo ${run}`, benefit: 'x', website: 'javascript:alert(1)' })
    expect(bad.error).not.toBeNull()
  })

  it('un líder sube el logo; un miembro no', async () => {
    const path = `com-${run}.png`
    const denied = await member.client.storage.from('partners').upload(path, png, { contentType: 'image/png' })
    expect(denied.error).not.toBeNull()
    const ok = await leader.client.storage.from('partners').upload(path, png, { contentType: 'image/png' })
    expect(ok.error).toBeNull()
    await leader.client.storage.from('partners').remove([path])
  })
})
