// Pruebas de permisos contra Supabase local. Cada rol solo debe poder leer y
// escribir lo que indica la tabla de permisos de la especificación.
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
const eventIds: string[] = []
const storagePaths: string[] = []

let pastEventId: string
let futureEventId: string
let suggestionId: string
const photoPath = `rls-${run}/foto.png`

// PNG de 1x1 píxel
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

async function createActor(label: string, patch?: { status?: string; role?: string }): Promise<Actor> {
  const email = `rls-${label}-${run}@neutro.test`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `RLS ${label}`, nickname: label },
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

  const day = 24 * 60 * 60 * 1000
  const { data: events, error } = await admin
    .from('events')
    .insert([
      { title: `RLS pasado ${run}`, starts_at: new Date(Date.now() - 30 * day).toISOString(), location: 'Ruta vieja' },
      { title: `RLS futuro ${run}`, starts_at: new Date(Date.now() + 1 * day).toISOString(), location: 'Ruta nueva' },
    ])
    .select('id, title')
  if (error) throw error
  pastEventId = events.find((e) => e.title.includes('pasado'))!.id
  futureEventId = events.find((e) => e.title.includes('futuro'))!.id
  eventIds.push(pastEventId, futureEventId)

  const { error: upErr } = await admin.storage.from('event-photos').upload(photoPath, png, { contentType: 'image/png' })
  if (upErr) throw upErr
  storagePaths.push(photoPath)
  // En un evento futuro: sus fotos no salen en la portada pública, así que son privadas
  const { error: photoErr } = await admin.from('event_photos').insert({ event_id: futureEventId, storage_path: photoPath })
  if (photoErr) throw photoErr

  const { data: sug, error: sugErr } = await admin
    .from('suggestions')
    .insert({ title: `RLS sugerencia ${run}`, proposed_by: member.id })
    .select('id')
    .single()
  if (sugErr) throw sugErr
  suggestionId = sug.id
})

afterAll(async () => {
  if (storagePaths.length) await admin.storage.from('event-photos').remove(storagePaths)
  await admin.from('featured_riders').delete().in('profile_id', userIds)
  await admin.from('events').delete().like('title', `%${run}%`)
  for (const id of userIds) await admin.auth.admin.deleteUser(id)
})

/** Una lectura está bloqueada si da error de permisos o no devuelve filas. */
function expectBlockedRead(result: { data: unknown; error: unknown }) {
  if (result.error) return
  expect(result.data).toEqual([])
}

describe('visitante sin sesión', () => {
  it.each(['events', 'profiles', 'suggestions', 'featured_riders', 'event_photos', 'event_videos'])(
    'no lee %s',
    async (table) => {
      expectBlockedRead(await anon.from(table).select('*'))
    },
  )

  it('obtiene solo próximos eventos (máx. 3) con columnas seguras', async () => {
    const { data, error } = await anon.rpc('public_upcoming_events')
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThan(0)
    expect(data!.length).toBeLessThanOrEqual(3)
    for (const row of data!) {
      expect(Object.keys(row).sort()).toEqual(['location', 'starts_at', 'title'])
      expect(new Date(row.starts_at).getTime()).toBeGreaterThanOrEqual(Date.now() - 60_000)
    }
    expect(data!.some((r: { title: string }) => r.title.includes('pasado'))).toBe(false)
  })

  it('puede consultar el destacado del mes', async () => {
    const { error } = await anon.rpc('public_current_featured')
    expect(error).toBeNull()
  })

  it('no puede aprobar sugerencias', async () => {
    const { error } = await anon.rpc('create_event_from_suggestion', {
      p_suggestion: suggestionId,
      p_title: 'x',
      p_description: '',
      p_location: '',
      p_starts_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()
  })
})

describe('miembro pendiente', () => {
  it('nace como member + pending', async () => {
    const { data } = await pending.client.from('profiles').select('role, status').eq('id', pending.id).single()
    expect(data).toEqual({ role: 'member', status: 'pending' })
  })

  it('lee solo su propio perfil', async () => {
    const { data } = await pending.client.from('profiles').select('id')
    expect(data!.map((p) => p.id)).toEqual([pending.id])
  })

  it.each(['events', 'suggestions', 'featured_riders', 'event_photos', 'event_videos'])('no lee %s', async (table) => {
    expectBlockedRead(await pending.client.from(table).select('*'))
  })

  it('no puede postular eventos', async () => {
    const { error } = await pending.client.from('suggestions').insert({ title: 'colado' })
    expect(error).not.toBeNull()
  })

  it('no puede aprobarse ni hacerse líder', async () => {
    await pending.client.from('profiles').update({ status: 'approved', role: 'leader' }).eq('id', pending.id)
    const { data } = await admin.from('profiles').select('role, status').eq('id', pending.id).single()
    expect(data).toEqual({ role: 'member', status: 'pending' })
  })

  it('no obtiene URL firmada de fotos', async () => {
    const { data, error } = await pending.client.storage.from('event-photos').createSignedUrl(photoPath, 60)
    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })
})

describe('miembro aprobado', () => {
  it('lee eventos, fotos y sugerencias', async () => {
    const events = await member.client.from('events').select('id').in('id', [pastEventId, futureEventId])
    expect(events.data).toHaveLength(2)
    const photos = await member.client.from('event_photos').select('id').eq('event_id', futureEventId)
    expect(photos.data).toHaveLength(1)
    const sugs = await member.client.from('suggestions').select('id').eq('id', suggestionId)
    expect(sugs.data).toHaveLength(1)
  })

  it('ve perfiles aprobados pero no pendientes', async () => {
    const { data } = await member.client.from('profiles').select('id').in('id', [pending.id, member.id, leader.id])
    expect(data!.map((p) => p.id).sort()).toEqual([member.id, leader.id].sort())
  })

  it('obtiene URL firmada de una foto', async () => {
    const { data, error } = await member.client.storage.from('event-photos').createSignedUrl(photoPath, 60)
    expect(error).toBeNull()
    expect(data!.signedUrl).toContain('token=')
  })

  it('postula un evento a su nombre, siempre como pendiente', async () => {
    const { data, error } = await member.client
      .from('suggestions')
      .insert({ title: `RLS postulado ${run}`, description: 'Rodada', tentative_date: '2027-01-15' })
      .select('proposed_by, status')
      .single()
    expect(error).toBeNull()
    expect(data).toEqual({ proposed_by: member.id, status: 'pending' })
  })

  it('no puede postular ya aprobado ni a nombre de otro', async () => {
    const approved = await member.client.from('suggestions').insert({ title: 'x', status: 'approved' })
    expect(approved.error).not.toBeNull()
    const other = await member.client.from('suggestions').insert({ title: 'x', proposed_by: leader.id })
    expect(other.error).not.toBeNull()
  })

  it('no cambia el estado de una sugerencia', async () => {
    await member.client.from('suggestions').update({ status: 'approved' }).eq('id', suggestionId)
    const { data } = await admin.from('suggestions').select('status').eq('id', suggestionId).single()
    expect(data!.status).toBe('pending')
  })

  it('no crea, edita ni borra eventos', async () => {
    const ins = await member.client.from('events').insert({ title: 'colado', starts_at: new Date().toISOString() })
    expect(ins.error).not.toBeNull()
    await member.client.from('events').update({ title: 'hackeado' }).eq('id', pastEventId)
    await member.client.from('events').delete().eq('id', pastEventId)
    const { data } = await admin.from('events').select('title').eq('id', pastEventId).single()
    expect(data!.title).toBe(`RLS pasado ${run}`)
  })

  it('no añade videos ni destacados', async () => {
    const video = await member.client.from('event_videos').insert({ event_id: pastEventId, youtube_id: 'dQw4w9WgXcQ' })
    expect(video.error).not.toBeNull()
    const featured = await member.client
      .from('featured_riders')
      .insert({ month: '2020-01-01', profile_id: member.id, reason: 'yo' })
    expect(featured.error).not.toBeNull()
  })

  it('no sube ni borra fotos', async () => {
    const up = await member.client.storage.from('event-photos').upload(`rls-${run}/colada.png`, png, { contentType: 'image/png' })
    expect(up.error).not.toBeNull()
    await member.client.storage.from('event-photos').remove([photoPath])
    const { data } = await admin.storage.from('event-photos').list(`rls-${run}`)
    expect(data!.map((f) => f.name)).toContain('foto.png')
  })

  it('no puede hacerse líder, pero sí editar su nombre', async () => {
    await member.client.from('profiles').update({ role: 'leader', full_name: 'Nombre nuevo' }).eq('id', member.id)
    const { data } = await admin.from('profiles').select('role, full_name').eq('id', member.id).single()
    expect(data).toEqual({ role: 'member', full_name: 'Nombre nuevo' })
  })

  it('no puede editar el perfil de otro', async () => {
    await member.client.from('profiles').update({ full_name: 'Suplantado' }).eq('id', leader.id)
    const { data } = await admin.from('profiles').select('full_name').eq('id', leader.id).single()
    expect(data!.full_name).toBe('RLS lider')
  })

  it('no puede aprobar sugerencias', async () => {
    const { error } = await member.client.rpc('create_event_from_suggestion', {
      p_suggestion: suggestionId,
      p_title: 'x',
      p_description: '',
      p_location: '',
      p_starts_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()
  })
})

describe('líder', () => {
  it('ve perfiles pendientes y los aprueba', async () => {
    const { data } = await leader.client.from('profiles').select('id').eq('id', pending.id)
    expect(data).toHaveLength(1)

    const tmp = await createActor('porAprobar')
    const { error } = await leader.client.from('profiles').update({ status: 'approved' }).eq('id', tmp.id)
    expect(error).toBeNull()
    const check = await admin.from('profiles').select('status').eq('id', tmp.id).single()
    expect(check.data!.status).toBe('approved')
  })

  it('nombra a otro líder', async () => {
    const tmp = await createActor('nuevoLider', { status: 'approved' })
    const { error } = await leader.client.from('profiles').update({ role: 'leader' }).eq('id', tmp.id)
    expect(error).toBeNull()
    const check = await admin.from('profiles').select('role').eq('id', tmp.id).single()
    expect(check.data!.role).toBe('leader')
  })

  it('no puede quitarse a sí mismo el liderazgo ni la aprobación', async () => {
    const demote = await leader.client.from('profiles').update({ role: 'member' }).eq('id', leader.id)
    expect(demote.error).not.toBeNull()
    const revoke = await leader.client.from('profiles').update({ status: 'rejected' }).eq('id', leader.id)
    expect(revoke.error).not.toBeNull()
    const { data } = await admin.from('profiles').select('role, status').eq('id', leader.id).single()
    expect(data).toEqual({ role: 'leader', status: 'approved' })
  })

  it('crea, edita y borra eventos con videos', async () => {
    const created = await leader.client
      .from('events')
      .insert({ title: `RLS del líder ${run}`, starts_at: new Date().toISOString() })
      .select('id, created_by')
      .single()
    expect(created.error).toBeNull()
    expect(created.data!.created_by).toBe(leader.id)
    const id = created.data!.id

    const updated = await leader.client.from('events').update({ chronicle: 'Gran rodada' }).eq('id', id)
    expect(updated.error).toBeNull()

    const video = await leader.client.from('event_videos').insert({ event_id: id, youtube_id: 'dQw4w9WgXcQ' })
    expect(video.error).toBeNull()
    const badVideo = await leader.client.from('event_videos').insert({ event_id: id, youtube_id: 'esto no es un id' })
    expect(badVideo.error).not.toBeNull()

    const deleted = await leader.client.from('events').delete().eq('id', id)
    expect(deleted.error).toBeNull()
    const videos = await admin.from('event_videos').select('id').eq('event_id', id)
    expect(videos.data).toEqual([])
  })

  it('sube y borra fotos', async () => {
    const path = `rls-${run}/lider.png`
    const up = await leader.client.storage.from('event-photos').upload(path, png, { contentType: 'image/png' })
    expect(up.error).toBeNull()
    const row = await leader.client.from('event_photos').insert({ event_id: pastEventId, storage_path: path })
    expect(row.error).toBeNull()
    const rm = await leader.client.storage.from('event-photos').remove([path])
    expect(rm.error).toBeNull()
    const { data } = await admin.storage.from('event-photos').list(`rls-${run}`)
    expect(data!.map((f) => f.name)).not.toContain('lider.png')
  })

  it('rechaza archivos que no son imágenes', async () => {
    const up = await leader.client.storage
      .from('event-photos')
      .upload(`rls-${run}/nota.txt`, Buffer.from('hola'), { contentType: 'text/plain' })
    expect(up.error).not.toBeNull()
  })

  it('elige al destacado del mes (uno por mes)', async () => {
    const first = await leader.client
      .from('featured_riders')
      .insert({ month: '2001-03-01', profile_id: member.id, reason: 'Siempre ayuda' })
    expect(first.error).toBeNull()
    const dup = await leader.client
      .from('featured_riders')
      .insert({ month: '2001-03-01', profile_id: leader.id, reason: 'Repetido' })
    expect(dup.error).not.toBeNull()
    const notFirstDay = await leader.client
      .from('featured_riders')
      .insert({ month: '2001-04-15', profile_id: member.id, reason: 'Día inválido' })
    expect(notFirstDay.error).not.toBeNull()
  })

  it('aprueba una sugerencia creando su evento', async () => {
    const startsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const { data: eventId, error } = await leader.client.rpc('create_event_from_suggestion', {
      p_suggestion: suggestionId,
      p_title: `RLS aprobado ${run}`,
      p_description: 'Desde sugerencia',
      p_location: 'Mirador',
      p_starts_at: startsAt,
    })
    expect(error).toBeNull()
    expect(eventId).toBeTruthy()

    const sug = await admin.from('suggestions').select('status, event_id').eq('id', suggestionId).single()
    expect(sug.data).toEqual({ status: 'approved', event_id: eventId })

    const again = await leader.client.rpc('create_event_from_suggestion', {
      p_suggestion: suggestionId,
      p_title: 'otra vez',
      p_description: '',
      p_location: '',
      p_starts_at: startsAt,
    })
    expect(again.error).not.toBeNull()
  })

  it('rechaza una sugerencia con nota', async () => {
    const { data: sug } = await admin
      .from('suggestions')
      .insert({ title: `RLS a rechazar ${run}`, proposed_by: member.id })
      .select('id')
      .single()
    const { error } = await leader.client
      .from('suggestions')
      .update({ status: 'rejected', leader_note: 'Fecha ocupada' })
      .eq('id', sug!.id)
    expect(error).toBeNull()
    const check = await member.client.from('suggestions').select('status, leader_note').eq('id', sug!.id).single()
    expect(check.data).toEqual({ status: 'rejected', leader_note: 'Fecha ocupada' })
  })
})
