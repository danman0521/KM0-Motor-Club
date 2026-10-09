import { useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field } from '../../components/ui'
import { toLocalInputValue } from '../../lib/dates'
import { friendlyError } from '../../lib/errors'
import { normalizeHttpUrl } from '../../lib/url'
import type { EventInput } from './api'

type Props = {
  initial?: Partial<EventInput>
  submitLabel: string
  /** La crónica se escribe después del evento; al crear uno nuevo suele ocultarse */
  showChronicle?: boolean
  onSubmit: (input: EventInput) => Promise<unknown>
}

export function EventForm({ initial, submitLabel, showChronicle = true, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [startsAt, setStartsAt] = useState(initial?.starts_at ? toLocalInputValue(initial.starts_at) : '')
  const [chronicle, setChronicle] = useState(initial?.chronicle ?? '')
  const [meetingPoint, setMeetingPoint] = useState(initial?.meeting_point ?? '')
  const [mapUrl, setMapUrl] = useState(initial?.map_url ?? '')
  const [errors, setErrors] = useState<{ title?: string; startsAt?: string; mapUrl?: string }>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Escribe el título del evento.'
    const date = startsAt ? new Date(startsAt) : null
    if (!date || Number.isNaN(date.getTime())) next.startsAt = 'Elige la fecha y la hora.'
    const url = mapUrl.trim() ? normalizeHttpUrl(mapUrl) : null
    if (mapUrl.trim() && !url) next.mapUrl = 'Ese enlace no es válido.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length || !date) return

    setBusy(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        starts_at: date.toISOString(),
        chronicle: chronicle.trim() || null,
        meeting_point: meetingPoint.trim(),
        map_url: url,
      })
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <ErrorNote message={formError} />}
      <Field label="Título" error={errors.title}>
        {(p) => <input {...p} maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha y hora" error={errors.startsAt}>
          {(p) => <input {...p} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />}
        </Field>
        <Field label="Lugar">{(p) => <input {...p} value={location} onChange={(e) => setLocation(e.target.value)} />}</Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Punto de encuentro" hint="Dónde se reúnen antes de salir.">
          {(p) => <input {...p} maxLength={200} value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} />}
        </Field>
        <Field label="Enlace de mapa (opcional)" error={errors.mapUrl} hint="Enlace de Google Maps del punto de encuentro o la ruta.">
          {(p) => <input {...p} inputMode="url" placeholder="https://maps.google.com/…" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />}
        </Field>
      </div>
      <Field label="Descripción" hint="Ruta, recomendaciones.">
        {(p) => <textarea {...p} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
      {showChronicle && (
        <Field label="Crónica" hint="Cómo estuvo el evento. Se muestra en el historial.">
          {(p) => <textarea {...p} rows={6} value={chronicle} onChange={(e) => setChronicle(e.target.value)} />}
        </Field>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
