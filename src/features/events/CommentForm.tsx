import { useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field } from '../../components/ui'
import { friendlyError } from '../../lib/errors'

const MAX = 1000

export function CommentForm({ onSubmit }: { onSubmit: (body: string) => Promise<unknown> }) {
  const [body, setBody] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const text = body.trim()
    if (!text) {
      setFieldError('Escribe tu comentario.')
      return
    }
    setFieldError('')

    setBusy(true)
    try {
      await onSubmit(text)
      setBody('')
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      {formError && <ErrorNote message={formError} />}
      <Field label="Tu comentario" error={fieldError}>
        {(p) => <textarea {...p} rows={3} maxLength={MAX} value={body} onChange={(e) => setBody(e.target.value)} />}
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? 'Enviando…' : 'Comentar'}
      </Button>
    </form>
  )
}
