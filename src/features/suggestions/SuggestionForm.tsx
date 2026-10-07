import { useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import type { SuggestionInput } from './api'

export function SuggestionForm({ onSubmit }: { onSubmit: (input: SuggestionInput) => Promise<unknown> }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [titleError, setTitleError] = useState('')
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSent(false)
    if (!title.trim()) {
      setTitleError('Escribe un título para el evento.')
      return
    }
    setTitleError('')

    setBusy(true)
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), tentative_date: date || null })
      setTitle('')
      setDescription('')
      setDate('')
      setSent(true)
    } catch (err) {
      // Se conserva lo escrito para poder reintentar
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <ErrorNote message={formError} />}
      {sent && <p className="rounded-md border border-gunmetal bg-gunmetal-dark px-4 py-3 text-sm text-steel">¡Sugerencia enviada! Los líderes la revisarán.</p>}
      <Field label="Título" error={titleError}>
        {(p) => <input {...p} maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} />}
      </Field>
      <Field label="Descripción" hint="Ruta, punto de encuentro, por qué vale la pena…">
        {(p) => <textarea {...p} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
      <Field label="Fecha tentativa (opcional)">
        {(p) => <input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? 'Enviando…' : 'Postular evento'}
      </Button>
    </form>
  )
}
