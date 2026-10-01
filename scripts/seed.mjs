// Datos de ejemplo para el Supabase LOCAL: un líder, miembros, eventos,
// destacados y sugerencias. Se puede ejecutar varias veces sin duplicar.
// Uso: npm run db:seed
import { createClient } from '@supabase/supabase-js'
import { readSupabaseEnv } from './supabase-env.mjs'

// Cuentas de prueba: válidas solo en tu PC. No usar en un despliegue real.
const PASSWORD = 'neutro-local-123'
const ACCOUNTS = [
  { email: 'lider@neutro.local', full_name: 'Carlos Rojas', nickname: 'El Lobo', role: 'leader', status: 'approved' },
  { email: 'miembro1@neutro.local', full_name: 'Andrea Gómez', nickname: 'Chispa', role: 'member', status: 'approved' },
  { email: 'miembro2@neutro.local', full_name: 'Julián Torres', nickname: null, role: 'member', status: 'approved' },
  { email: 'pendiente@neutro.local', full_name: 'Mateo Díaz', nickname: 'Tuerca', role: 'member', status: 'pending' },
]

const { url, serviceKey } = readSupabaseEnv()
if (!/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  throw new Error(`El seed solo corre contra Supabase local, no contra ${url}`)
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

function check({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

const day = 24 * 60 * 60 * 1000
const at = (offsetDays, hour) => {
  const d = new Date(Date.now() + offsetDays * day)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}
const monthStart = (offsetMonths) => {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// --- Cuentas ---------------------------------------------------------------
const existing = check(await admin.auth.admin.listUsers({ perPage: 1000 }), 'listar usuarios').users
const ids = {}
for (const account of ACCOUNTS) {
  let user = existing.find((u) => u.email === account.email)
  if (!user) {
    user = check(
      await admin.auth.admin.createUser({
        email: account.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: account.full_name, nickname: account.nickname ?? '' },
      }),
      `crear ${account.email}`,
    ).user
  }
  ids[account.email] = user.id
  check(
    await admin.from('profiles').update({ role: account.role, status: account.status }).eq('id', user.id),
    `perfil de ${account.email}`,
  )
}
const leader = ids['lider@neutro.local']
const andrea = ids['miembro1@neutro.local']
const julian = ids['miembro2@neutro.local']

// --- Eventos ---------------------------------------------------------------
const EVENTS = [
  {
    title: 'Rodada al Alto de Letras',
    description: 'Salida de día completo por la ruta de montaña. Punto de encuentro: estación de servicio a la salida de la ciudad.',
    location: 'Alto de Letras',
    starts_at: at(-45, 6),
    chronicle:
      'Salimos 18 motos con el amanecer. Hubo neblina en la parte alta, pero el grupo se mantuvo compacto y sin novedades.\n\nAlmorzamos en el mirador y regresamos antes de que cayera la tarde. Gran jornada.',
    created_by: leader,
    videos: [{ youtube_id: 'aqz-KE-bpKQ', title: 'Resumen de la rodada' }],
  },
  {
    title: 'Jornada de mecánica básica',
    description: 'Taller entre amigos: tensión de cadena, cambio de aceite y revisión de frenos.',
    location: 'Taller de Julián',
    starts_at: at(-14, 9),
    chronicle: 'Doce asistentes. Revisamos ocho motos y dejamos tres cadenas como nuevas. Queda pendiente la segunda parte: eléctrica.',
    created_by: leader,
    videos: [],
  },
  {
    title: 'Rodada nocturna por la ciudad',
    description: 'Recorrido urbano corto. Chaleco reflectivo obligatorio.',
    location: 'Parque principal',
    starts_at: at(6, 19),
    chronicle: null,
    created_by: leader,
    videos: [],
  },
  {
    title: 'Asado de integración',
    description: 'Familias bienvenidas. Cada quien lleva lo suyo para la parrilla.',
    location: 'Finca La Herradura',
    starts_at: at(20, 12),
    chronicle: null,
    created_by: leader,
    videos: [],
  },
]

const eventIds = {}
for (const { videos, ...event } of EVENTS) {
  let row = check(await admin.from('events').select('id').eq('title', event.title).maybeSingle(), `buscar ${event.title}`)
  if (!row) {
    row = check(await admin.from('events').insert(event).select('id').single(), `crear ${event.title}`)
    for (const video of videos) {
      check(await admin.from('event_videos').insert({ event_id: row.id, ...video }), `video de ${event.title}`)
    }
  }
  eventIds[event.title] = row.id
}

// --- Destacados ------------------------------------------------------------
const FEATURED = [
  { month: monthStart(0), profile_id: andrea, reason: 'Organizó la jornada de mecánica y siempre es la primera en ayudar a quien se queda varado.' },
  { month: monthStart(-1), profile_id: julian, reason: 'Prestó su taller para el grupo y acompañó a los nuevos en su primera rodada larga.' },
]
for (const featured of FEATURED) {
  check(
    await admin.from('featured_riders').upsert({ ...featured, created_by: leader }, { onConflict: 'month', ignoreDuplicates: true }),
    `destacado ${featured.month}`,
  )
}

// --- Sugerencias -----------------------------------------------------------
const SUGGESTIONS = [
  { title: 'Rodada a la laguna', description: 'Ruta de unas tres horas, con parada para desayunar.', proposed_by: andrea, status: 'pending' },
  {
    title: 'Asado de integración',
    description: 'Un día en finca para conocernos con las familias.',
    proposed_by: julian,
    status: 'approved',
    event_id: eventIds['Asado de integración'],
  },
  {
    title: 'Viaje de una semana a la costa',
    description: 'Salir un lunes y volver el domingo.',
    proposed_by: julian,
    status: 'rejected',
    leader_note: 'Muy buena idea, pero este año no hay fechas. La retomamos en enero.',
  },
]
for (const suggestion of SUGGESTIONS) {
  const found = check(
    await admin.from('suggestions').select('id').eq('title', suggestion.title).eq('proposed_by', suggestion.proposed_by).maybeSingle(),
    `buscar sugerencia ${suggestion.title}`,
  )
  if (!found) check(await admin.from('suggestions').insert(suggestion), `crear sugerencia ${suggestion.title}`)
}

console.log('Datos de ejemplo listos.')
console.log('Cuentas de prueba (la contraseña está en scripts/seed.mjs):')
for (const a of ACCOUNTS) console.log(`  ${a.email}  →  ${a.role === 'leader' ? 'líder' : a.status === 'pending' ? 'pendiente' : 'miembro'}`)
