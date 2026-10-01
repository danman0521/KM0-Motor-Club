import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Button, Card, ErrorNote, Field, Spinner } from '../components/ui'
import { friendlyError } from '../lib/errors'

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  // Con sesión, la guarda de la zona privada decide el destino final
  if (session) return <Navigate to={from ?? '/eventos'} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Escribe tu correo.'
    if (!password) next.password = 'Escribe tu contraseña.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">Ingresar</h1>
      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          <Field label="Correo" error={errors.email}>
            {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Contraseña" error={errors.password}>
            {(p) => (
              <input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-steel underline hover:text-ink">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
