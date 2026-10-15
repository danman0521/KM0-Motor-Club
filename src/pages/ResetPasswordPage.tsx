import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Button, Card, ErrorNote, Field } from '../components/ui'
import { friendlyError } from '../lib/errors'

const MIN_LENGTH = 6

/** Se muestra tras abrir el enlace de recuperación: define la nueva contraseña. */
export function ResetPasswordPage() {
  const { updatePassword, exitRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (password.length < MIN_LENGTH) next.password = `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`
    if (confirm !== password) next.confirm = 'Las contraseñas no coinciden.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">Nueva contraseña</h1>
      <Card>
        {done ? (
          <div className="space-y-4">
            <p className="rounded-md border border-gunmetal bg-gunmetal-dark px-4 py-3 text-sm text-steel">
              Tu contraseña se actualizó. Ya puedes seguir usando tu cuenta.
            </p>
            <Button className="w-full" onClick={exitRecovery}>
              Continuar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && <ErrorNote message={formError} />}
            <p className="text-sm text-steel">Elige una contraseña nueva para tu cuenta.</p>
            <Field label="Nueva contraseña" error={errors.password}>
              {(p) => (
                <input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              )}
            </Field>
            <Field label="Repite la contraseña" error={errors.confirm}>
              {(p) => (
                <input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              )}
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
            <button type="button" onClick={exitRecovery} className="w-full text-center text-sm text-muted underline hover:text-steel">
              Cancelar
            </button>
          </form>
        )}
      </Card>
    </div>
  )
}
