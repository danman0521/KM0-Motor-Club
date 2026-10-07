import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/Avatar'
import { Badge, Button, Card, ErrorNote, Field, PageTitle } from '../components/ui'
import { useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '../features/profile/api'
import { friendlyError } from '../lib/errors'
import { isImageFile } from '../lib/images'
import type { Profile } from '../lib/supabase'

export function ProfilePage() {
  const { profile } = useAuth()
  // La ruta está protegida: aquí siempre hay perfil
  if (!profile) return null
  return <ProfileEditor key={profile.id} profile={profile} />
}

function ProfileEditor({ profile }: { profile: Profile }) {
  const update = useUpdateProfile(profile.id)
  const upload = useUploadAvatar(profile.id)
  const remove = useRemoveAvatar(profile.id)
  const fileInput = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile.full_name)
  const [nickname, setNickname] = useState(profile.nickname ?? '')
  const [nameError, setNameError] = useState('')
  const [formError, setFormError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    if (!isImageFile(file)) {
      setPhotoError('Solo se pueden subir imágenes.')
      return
    }
    try {
      await upload.mutateAsync({ file, previousPath: profile.avatar_path })
    } catch (err) {
      setPhotoError(friendlyError(err))
    }
  }

  async function handleRemove() {
    if (!profile.avatar_path) return
    setPhotoError('')
    try {
      await remove.mutateAsync(profile.avatar_path)
    } catch (err) {
      setPhotoError(friendlyError(err))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSaved(false)
    if (!fullName.trim()) {
      setNameError('Escribe tu nombre completo.')
      return
    }
    setNameError('')
    try {
      await update.mutateAsync({ fullName: fullName.trim(), nickname: nickname.trim() })
      setSaved(true)
    } catch (err) {
      setFormError(friendlyError(err))
    }
  }

  const photoBusy = upload.isPending || remove.isPending

  return (
    <>
      <PageTitle>Mi perfil</PageTitle>
      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <Card className="flex flex-col items-center gap-4 text-center">
          <Avatar profile={profile} size="lg" />
          {profile.role === 'leader' && <Badge tone="red">Líder</Badge>}
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={handlePhoto} aria-label="Elegir foto de perfil" />
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => fileInput.current?.click()} disabled={photoBusy}>
              {upload.isPending ? 'Subiendo…' : profile.avatar_path ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            {profile.avatar_path && (
              <Button variant="ghost" onClick={handleRemove} disabled={photoBusy}>
                Quitar
              </Button>
            )}
          </div>
          {photoError && <ErrorNote message={photoError} />}
          <p className="text-xs text-muted">Tu foto la ven los demás miembros junto a tu nombre.</p>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && <ErrorNote message={formError} />}
            {saved && <p className="rounded-md border border-gunmetal bg-gunmetal-dark px-4 py-3 text-sm text-steel">Perfil guardado.</p>}
            <Field label="Nombre completo" error={nameError}>
              {(p) => <input {...p} maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />}
            </Field>
            <Field label="Apodo (opcional)" hint="Como te conocen en el grupo. Si lo pones, se muestra en lugar de tu nombre.">
              {(p) => <input {...p} maxLength={60} value={nickname} onChange={(e) => setNickname(e.target.value)} />}
            </Field>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
