import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Button, Card, ErrorNote, Field, Spinner } from '../components/ui'
import { friendlyError } from '../lib/errors'

type Errors = { fullName?: string; email?: string; password?: string }

export function RegisterPage() {
  const { session, loading, signUp } = useAuth()

  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  // Recién registrado queda pendiente; la guarda lo lleva a la pantalla de espera
  if (session) return <Navigate to="/eventos" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!fullName.trim()) next.fullName = 'Escribe tu nombre completo.'
    if (!email.trim()) next.email = 'Escribe tu correo.'
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'El correo no es válido.'
    if (password.length < 6) next.password = 'La contraseña debe tener al menos 6 caracteres.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await signUp({ email: email.trim(), password, fullName: fullName.trim(), nickname: nickname.trim() })
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">Registrarse</h1>
      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          <Field label="Nombre completo" error={errors.fullName}>
            {(p) => <input {...p} autoComplete="name" maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />}
          </Field>
          <Field label="Apodo (opcional)" hint="Como te conocen en el grupo.">
            {(p) => <input {...p} maxLength={60} value={nickname} onChange={(e) => setNickname(e.target.value)} />}
          </Field>
          <Field label="Correo" error={errors.email}>
            {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Contraseña" error={errors.password} hint="Mínimo 6 caracteres.">
            {(p) => (
              <input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
          <p className="text-xs text-muted">Un líder debe aprobar tu solicitud antes de que puedas ver la zona de miembros.</p>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/ingresar" className="font-semibold text-steel underline hover:text-ink">
          Ingresa
        </Link>
      </p>
    </div>
  )
}
