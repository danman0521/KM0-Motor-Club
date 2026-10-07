import { useRef, useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { isImageFile } from '../../lib/images'
import { displayName, type Profile } from '../../lib/supabase'
import type { FeaturedInput } from './api'

type Props = {
  members: Profile[]
  /** Mes que se edita (`YYYY-MM-01`) y valores a precargar */
  initial: { month: string; profile_id: string; reason: string }
  hasPhoto: boolean
  onSubmit: (input: FeaturedInput) => Promise<unknown>
}

export function FeaturedForm({ members, initial, hasPhoto, onSubmit }: Props) {
  const [profileId, setProfileId] = useState(initial.profile_id)
  const [reason, setReason] = useState(initial.reason)
  const [photo, setPhoto] = useState<File | null>(null)
  const [errors, setErrors] = useState<{ profile?: string; reason?: string; photo?: string }>({})
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!profileId) next.profile = 'Elige a un miembro.'
    if (!reason.trim()) next.reason = 'Cuenta por qué es el destacado.'
    if (photo && !isImageFile(photo)) next.photo = 'Solo se pueden subir imágenes.'
    setErrors(next)
    setFormError('')
    setSaved(false)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await onSubmit({ month: initial.month, profile_id: profileId, reason: reason.trim(), photo })
      setPhoto(null)
      if (fileInput.current) fileInput.current.value = ''
      setSaved(true)
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <ErrorNote message={formError} />}
      {saved && <p className="rounded-md border border-gunmetal bg-gunmetal-dark px-4 py-3 text-sm text-steel">Destacado guardado.</p>}
      <Field label="Miembro" error={errors.profile}>
        {(p) => (
          <select {...p} value={profileId} onChange={(e) => setProfileId(e.target.value)}>
            <option value="">Elige a un miembro…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {displayName(m)}
                {m.nickname ? ` (${m.full_name})` : ''}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Motivo" error={errors.reason}>
        {(p) => <textarea {...p} rows={4} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />}
      </Field>
      <Field label="Foto" error={errors.photo} hint={hasPhoto ? 'Ya tiene foto; elige otra solo si quieres cambiarla.' : undefined}>
        {(p) => (
          <input
            {...p}
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        )}
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar destacado'}
      </Button>
    </form>
  )
}
