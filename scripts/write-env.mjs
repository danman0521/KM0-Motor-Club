// Escribe .env.local con la URL y la clave pública del Supabase local.
import { writeFileSync } from 'node:fs'
import { readSupabaseEnv } from './supabase-env.mjs'

const { url, anonKey } = readSupabaseEnv()
writeFileSync('.env.local', `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${anonKey}\n`)
console.log('.env.local actualizado con los datos del Supabase local.')
