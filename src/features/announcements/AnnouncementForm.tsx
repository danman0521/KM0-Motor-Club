import { useId, useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field } from '../../components/ui'
import { friendlyError } from '../../lib/errors'

export type AnnouncementInput = { title: string; body: string; pinned: boolean }

type Props = {
  initial?: Partial<AnnouncementInput>
  submitLabel: string
  onSubmit: (input: AnnouncementInput) => Promise<unknown>
  onCancel?: () => void
}

export function AnnouncementForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [pinned, setPinned] = useState(initial?.pinned ?? false)
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const pinnedId = useId()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Escribe el título.'
    if (!body.trim()) next.body = 'Escribe el contenido.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await onSubmit({ title: title.trim(), body: body.trim(), pinned })
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
      <Field label="Contenido" error={errors.body}>
        {(p) => <textarea {...p} rows={5} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />}
      </Field>
      <div className="flex items-center gap-2">
        <input id={pinnedId} type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-red" />
        <label htmlFor={pinnedId} className="text-sm">
          Fijar arriba
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Guardando…' : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
