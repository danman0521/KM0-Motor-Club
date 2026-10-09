import { beforeEach, describe, expect, it, vi } from 'vitest'

// Registro de operaciones y resultados controlables del mock de Supabase
const calls: string[] = []
const removed: string[][] = []
let writeResult: { error: unknown } = { error: null }
let selectResult: { data: { photo_path: string | null } | null; error: unknown } = {
  data: { photo_path: 'u1/old.jpg' },
  error: null,
}

vi.mock('../../lib/images', () => ({ compressPhoto: vi.fn(async (f: File) => f) }))
vi.mock('../../lib/supabase', () => {
  const storage = {
    from: () => ({
      upload: vi.fn(async (path: string) => {
        calls.push('upload')
        return { error: null, data: { path } }
      }),
      remove: vi.fn(async (paths: string[]) => {
        calls.push('remove')
        removed.push(paths)
        return { error: null }
      }),
    }),
  }
  const table = () => ({
    select: () => ({ eq: () => ({ single: async () => { calls.push('select'); return selectResult } }) }),
    update: () => ({ eq: async () => { calls.push('update'); return writeResult } }),
    insert: async () => { calls.push('insert'); return writeResult },
  })
  return { supabase: { from: table, storage } }
})

const { saveMotorcycle } = await import('./api')

const file = new File([new Uint8Array([1])], 'x.jpg', { type: 'image/jpeg' })
const baseInput = { brand: 'Yamaha', model: 'MT-07', year: null, displacement_cc: null, color: '', plate: '' }

beforeEach(() => {
  calls.length = 0
  removed.length = 0
  writeResult = { error: null }
  selectResult = { data: { photo_path: 'u1/old.jpg' }, error: null }
})

describe('saveMotorcycle: foto al editar', () => {
  it('con un update exitoso, borra la foto antigua después del update', async () => {
    await saveMotorcycle('u1', { id: 'm1', input: { ...baseInput, photo: file } })
    expect(calls.indexOf('update')).toBeLessThan(calls.indexOf('remove'))
    expect(removed).toEqual([['u1/old.jpg']])
  })

  it('si el update falla, NO borra la foto antigua y limpia la foto nueva', async () => {
    writeResult = { error: { message: 'check displacement_cc' } }
    await expect(saveMotorcycle('u1', { id: 'm1', input: { ...baseInput, photo: file } })).rejects.toBeTruthy()
    // La foto antigua nunca se borra
    expect(removed.flat()).not.toContain('u1/old.jpg')
    // La foto nueva (recién subida) sí se limpia para no dejarla huérfana
    expect(removed).toHaveLength(1)
  })

  it('al crear, si el insert falla, limpia la foto nueva', async () => {
    writeResult = { error: { message: 'boom' } }
    await expect(saveMotorcycle('u1', { input: { ...baseInput, photo: file } })).rejects.toBeTruthy()
    expect(removed).toHaveLength(1)
  })
})
