// Portada pública: eventos realizados con sus fotos. Solo las fotos que se
// muestran ahí quedan abiertas a visitantes; el resto de cada galería no.
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error módulo JS sin tipos
import { readSupabaseEnv } from '../../scripts/supabase-env.mjs'

const env = readSupabaseEnv() as { url: string; anonKey: string; serviceKey: string }
const run = Date.now()
const noSession = { auth: { persistSession: false, autoRefreshToken: false } }

const admin = createClient(env.url, env.serviceKey, noSession)
const anon = createClient(env.url, env.anonKey, noSession)

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

const folder = `portada-${run}`
const pastPaths = [1, 2, 3, 4, 5].map((n) => `${folder}/pasado-${n}.png`)
const coverPath = pastPaths[2]
const futurePath = `${folder}/futuro.png`
const emptyTitle = `PORTADA sin fotos ${run}`
const pastTitle = `PORTADA pasado ${run}`
const futureTitle = `PORTADA futuro ${run}`

type PublicEvent = { title: string; starts_at: string; location: string; photos: string[] }

beforeAll(async () => {
  const minute = 60 * 1000
  const { data: events, error } = await admin
    .from('events')
    .insert([
      // Los más recientes, para que entren entre los que muestra la portada
      { title: pastTitle, starts_at: new Date(Date.now() - 1 * minute).toISOString(), location: 'Mirador', cover_photo_path: coverPath },
      { title: emptyTitle, starts_at: new Date(Date.now() - 2 * minute).toISOString(), location: '', cover_photo_path: null },
      { title: futureTitle, starts_at: new Date(Date.now() + 60 * minute).toISOString(), location: '', cover_photo_path: futurePath },
    ])
    .select('id, title')
  if (error) throw error
  const idOf = (title: string) => events.find((e) => e.title === title)!.id

  for (const path of [...pastPaths, futurePath]) {
    const { error: upErr } = await admin.storage.from('event-photos').upload(path, png, { contentType: 'image/png' })
    if (upErr) throw upErr
  }
  // created_at explícito para fijar el orden de las fotos
  const rows = [
    ...pastPaths.map((path, i) => ({
      event_id: idOf(pastTitle),
      storage_path: path,
      created_at: new Date(Date.now() - (10 - i) * minute).toISOString(),
    })),
    { event_id: idOf(futureTitle), storage_path: futurePath, created_at: new Date().toISOString() },
  ]
  const { error: rowsErr } = await admin.from('event_photos').insert(rows)
  if (rowsErr) throw rowsErr
})

afterAll(async () => {
  await admin.storage.from('event-photos').remove([...pastPaths, futurePath])
  await admin.from('events').delete().like('title', `%${run}%`)
})

describe('portada pública: eventos realizados', () => {
  let events: PublicEvent[]

  beforeAll(async () => {
    const { data, error } = await anon.rpc('public_past_events')
    if (error) throw error
    events = data as PublicEvent[]
  })

  it('devuelve como máximo 6 eventos, solo pasados, del más reciente al más antiguo', () => {
    expect(events.length).toBeLessThanOrEqual(6)
    expect(events.map((e) => e.title)).not.toContain(futureTitle)
    expect(events[0].title).toBe(pastTitle)
    const times = events.map((e) => new Date(e.starts_at).getTime())
    expect(times).toEqual([...times].sort((a, b) => b - a))
    for (const e of events) expect(new Date(e.starts_at).getTime()).toBeLessThan(Date.now())
  })

  it('solo expone columnas seguras', () => {
    expect(Object.keys(events[0]).sort()).toEqual(['location', 'photos', 'starts_at', 'title'])
  })

  it('da hasta 4 fotos por evento, con la portada primero y el resto en orden de subida', () => {
    const past = events.find((e) => e.title === pastTitle)!
    expect(past.photos).toEqual([coverPath, pastPaths[0], pastPaths[1], pastPaths[3]])
  })

  it('un evento sin fotos devuelve una lista vacía', () => {
    expect(events.find((e) => e.title === emptyTitle)!.photos).toEqual([])
  })

  it('el visitante obtiene URL firmadas de las fotos de la portada y puede descargarlas', async () => {
    const past = events.find((e) => e.title === pastTitle)!
    const { data, error } = await anon.storage.from('event-photos').createSignedUrls(past.photos, 60)
    expect(error).toBeNull()
    expect(data!.every((d) => d.signedUrl && !d.error)).toBe(true)
    const response = await fetch(data![0].signedUrl)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
  })

  it('el visitante no accede a la quinta foto ni a fotos de eventos futuros', async () => {
    for (const path of [pastPaths[4], futurePath]) {
      const { data, error } = await anon.storage.from('event-photos').createSignedUrl(path, 60)
      expect(error).not.toBeNull()
      expect(data).toBeNull()
    }
  })

  it('el visitante sigue sin leer las tablas de eventos y fotos', async () => {
    for (const table of ['events', 'event_photos']) {
      const result = await anon.from(table).select('*')
      if (!result.error) expect(result.data).toEqual([])
    }
  })
})
