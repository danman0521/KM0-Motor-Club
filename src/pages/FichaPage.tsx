import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Card, ErrorNote, PageTitle, Spinner } from '../components/ui'
import { ApplicationForm } from '../features/applications/ApplicationForm'
import { useApplication, useSaveApplication } from '../features/applications/api'

/** Un miembro aprobado puede ver y actualizar su propia ficha. */
export function FichaPage() {
  const { session, profile } = useAuth()
  const userId = session!.user.id
  const application = useApplication(userId)
  const save = useSaveApplication(userId)
  const [saved, setSaved] = useState(false)

  return (
    <>
      <PageTitle
        action={
          <Link to="/perfil" className="text-sm text-steel hover:text-ink">
            ← Mi perfil
          </Link>
        }
      >
        Mi ficha
      </PageTitle>
      <p className="mb-6 max-w-2xl text-steel">
        Datos de contacto y de seguridad que solo ven los líderes. Mantenlos al día: son los que usarán si pasa algo
        en una rodada.
      </p>
      {application.isPending && <Spinner />}
      {application.isError && <ErrorNote message="No se pudo cargar tu ficha." onRetry={() => application.refetch()} />}
      {application.isSuccess && (
        <Card className="max-w-2xl space-y-4">
          {saved && <p className="rounded-md border border-gunmetal bg-gunmetal-dark px-4 py-3 text-sm text-steel">Ficha guardada.</p>}
          <ApplicationForm
            key={application.data?.updated_at ?? 'nueva'}
            initial={application.data ?? undefined}
            hasRiderPhoto={!!profile?.avatar_path}
            hasMotoPhoto={!!application.data?.moto_photo_path}
            submitLabel={application.data ? 'Guardar cambios' : 'Enviar ficha'}
            onSubmit={async (submission) => {
              setSaved(false)
              await save.mutateAsync(submission)
              setSaved(true)
            }}
          />
        </Card>
      )}
    </>
  )
}
