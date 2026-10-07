import { Avatar } from '../../components/Avatar'
import { Badge, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { ageFrom, formatDay, formatDayOf } from '../../lib/dates'
import type { Profile } from '../../lib/supabase'
import { useApplication, useMotoPhotoUrl } from './api'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="whitespace-pre-line">{value || <span className="text-muted">—</span>}</dd>
    </div>
  )
}

/** Ficha de un miembro tal como la ven los líderes (o la propia persona). */
export function ApplicationDetails({ profile }: { profile: Profile }) {
  const application = useApplication(profile.id)
  const motoPhoto = useMotoPhotoUrl(application.data?.moto_photo_path)

  if (application.isPending) return <Spinner label="Cargando ficha…" />
  if (application.isError) return <ErrorNote message="No se pudo cargar la ficha." onRetry={() => application.refetch()} />
  if (!application.data) return <EmptyState>Esta persona aún no ha enviado su ficha de postulación.</EmptyState>

  const a = application.data
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar profile={profile} size="lg" />
        <div>
          <p className="text-xl font-bold">{profile.full_name}</p>
          {profile.nickname && <p className="text-steel">«{profile.nickname}»</p>}
          <p className="text-sm text-muted">Ficha enviada el {formatDayOf(a.submitted_at)}</p>
        </div>
      </div>

      <dl className="space-y-2">
        <Row label="Vive en" value={a.city} />
        <Row label="Se dedica a" value={a.occupation} />
        <Row label="Nacimiento" value={`${formatDay(a.birth_date)} (${ageFrom(a.birth_date)} años)`} />
        <Row label="Celular" value={a.phone} />
        <Row label="Otro grupo motero" value={a.other_club || 'No'} />
      </dl>

      <div className="rounded-lg border border-red-dark bg-red-dark/15 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
          Seguridad <Badge tone="red">Solo líderes</Badge>
        </h3>
        <dl className="space-y-2">
          <Row label="Tipo de sangre (RH)" value={a.blood_type} />
          <Row label="Alergias" value={a.allergies || 'Ninguna reportada'} />
          <Row label="Condiciones de salud" value={a.medical_conditions || 'Ninguna reportada'} />
          <Row label="Contacto de emergencia" value={a.emergency_contact_name} />
          <Row label="Teléfono de emergencia" value={a.emergency_contact_phone} />
        </dl>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-bold">Su moto</h3>
        {!a.moto_photo_path && <p className="text-sm text-muted">Sin foto de la moto.</p>}
        {a.moto_photo_path && motoPhoto.isPending && <Spinner label="Cargando foto…" />}
        {motoPhoto.data && (
          <img src={motoPhoto.data} alt={`Moto de ${profile.full_name}`} className="max-h-80 rounded-md border border-surface-2 object-contain" />
        )}
      </div>
    </div>
  )
}
