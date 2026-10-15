import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Button, Card, ErrorNote, Field } from '../components/ui'
import { friendlyError } from '../lib/errors'

/** Pide el correo y envía el enlace para restablecer la contraseña. */
export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Escribe tu correo.')
      return
    }
    setError('')
    setFormError('')
    setBusy(true)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">Recuperar contraseña</h1>
      <Card>
        {sent ? (
          <div className="space-y-3">
            <p className="rounded-md border border-gunmetal bg-gunmetal-dark px-4 py-3 text-sm text-steel">
              Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña. Revisa tu bandeja de
              entrada y la carpeta de spam.
            </p>
            <Link to="/ingresar" className="inline-block text-sm font-semibold text-steel underline hover:text-ink">
              Volver a ingresar
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && <ErrorNote message={formError} />}
            <p className="text-sm text-steel">Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.</p>
            <Field label="Correo" error={error}>
              {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>
        )}
      </Card>
      {!sent && (
        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/ingresar" className="font-semibold text-steel underline hover:text-ink">
            Volver a ingresar
          </Link>
        </p>
      )}
    </div>
  )
}
