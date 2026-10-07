import { useId, useRef, useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field } from '../../components/ui'
import { ageFrom } from '../../lib/dates'
import { friendlyError } from '../../lib/errors'
import { isImageFile } from '../../lib/images'
import { BLOOD_TYPES, type ApplicationInput, type ApplicationSubmission, type BloodType } from './api'

const MIN_AGE = 16
const MAX_AGE = 100

type Props = {
  initial?: Partial<ApplicationInput>
  hasRiderPhoto?: boolean
  hasMotoPhoto?: boolean
  submitLabel: string
  onSubmit: (submission: ApplicationSubmission) => Promise<unknown>
  onCancel?: () => void
}

type Errors = Partial<Record<keyof ApplicationInput | 'riderPhoto' | 'motoPhoto', string>>

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Ficha de postulación: datos personales, de contacto y de seguridad. */
export function ApplicationForm({ initial, hasRiderPhoto = false, hasMotoPhoto = false, submitLabel, onSubmit, onCancel }: Props) {
  const [city, setCity] = useState(initial?.city ?? '')
  const [occupation, setOccupation] = useState(initial?.occupation ?? '')
  const [birthDate, setBirthDate] = useState(initial?.birth_date ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [inOtherClub, setInOtherClub] = useState(!!initial?.other_club)
  const [otherClub, setOtherClub] = useState(initial?.other_club ?? '')
  const [bloodType, setBloodType] = useState<BloodType | ''>(initial?.blood_type ?? '')
  const [allergies, setAllergies] = useState(initial?.allergies ?? '')
  const [conditions, setConditions] = useState(initial?.medical_conditions ?? '')
  const [contactName, setContactName] = useState(initial?.emergency_contact_name ?? '')
  const [contactPhone, setContactPhone] = useState(initial?.emergency_contact_phone ?? '')
  const [riderPhoto, setRiderPhoto] = useState<File | null>(null)
  const [motoPhoto, setMotoPhoto] = useState<File | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const riderInput = useRef<HTMLInputElement>(null)
  const motoInput = useRef<HTMLInputElement>(null)
  const otherClubId = useId()

  const age = isValidDate(birthDate) ? ageFrom(birthDate) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!city.trim()) next.city = 'Dinos dónde vives.'
    if (!occupation.trim()) next.occupation = 'Dinos a qué te dedicas.'
    if (!birthDate) next.birth_date = 'Escribe tu fecha de nacimiento.'
    else if (!isValidDate(birthDate) || age === null || age > MAX_AGE) next.birth_date = 'Revisa la fecha de nacimiento.'
    else if (age < MIN_AGE) next.birth_date = `Revisa la fecha: hay que tener al menos ${MIN_AGE} años.`
    if (inOtherClub && !otherClub.trim()) next.other_club = 'Dinos a cuál grupo perteneces.'
    if (!bloodType) next.blood_type = 'Elige tu tipo de sangre.'
    if (!contactName.trim()) next.emergency_contact_name = 'Escribe el nombre de tu contacto de emergencia.'
    if (!contactPhone.trim()) next.emergency_contact_phone = 'Escribe el teléfono de tu contacto de emergencia.'
    if (riderPhoto && !isImageFile(riderPhoto)) next.riderPhoto = 'Solo se pueden subir imágenes.'
    if (motoPhoto && !isImageFile(motoPhoto)) next.motoPhoto = 'Solo se pueden subir imágenes.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length || !bloodType) return

    setBusy(true)
    try {
      await onSubmit({
        input: {
          city: city.trim(),
          occupation: occupation.trim(),
          birth_date: birthDate,
          phone: phone.trim(),
          other_club: inOtherClub ? otherClub.trim() : '',
          blood_type: bloodType,
          allergies: allergies.trim(),
          medical_conditions: conditions.trim(),
          emergency_contact_name: contactName.trim(),
          emergency_contact_phone: contactPhone.trim(),
        },
        riderPhoto,
        motoPhoto,
      })
      setRiderPhoto(null)
      setMotoPhoto(null)
      if (riderInput.current) riderInput.current.value = ''
      if (motoInput.current) motoInput.current.value = ''
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && <ErrorNote message={formError} />}

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-lg uppercase tracking-wide text-steel">Sobre ti</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="¿Dónde vives?" error={errors.city} hint="Ciudad o barrio.">
            {(p) => <input {...p} maxLength={120} value={city} onChange={(e) => setCity(e.target.value)} />}
          </Field>
          <Field label="¿A qué te dedicas?" error={errors.occupation}>
            {(p) => <input {...p} maxLength={120} value={occupation} onChange={(e) => setOccupation(e.target.value)} />}
          </Field>
          <Field label="Fecha de nacimiento" error={errors.birth_date} hint={age !== null && age >= 0 ? `${age} años` : undefined}>
            {(p) => <input {...p} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />}
          </Field>
          <Field label="Tu celular (opcional)">
            {(p) => <input {...p} type="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id={otherClubId}
              type="checkbox"
              checked={inOtherClub}
              onChange={(e) => setInOtherClub(e.target.checked)}
              className="h-4 w-4 accent-red"
            />
            <label htmlFor={otherClubId} className="text-sm">
              Pertenezco a otro grupo motero
            </label>
          </div>
          {inOtherClub && (
            <Field label="¿Cuál?" error={errors.other_club}>
              {(p) => <input {...p} maxLength={120} value={otherClub} onChange={(e) => setOtherClub(e.target.value)} />}
            </Field>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-lg uppercase tracking-wide text-steel">Seguridad</legend>
        <p className="text-sm text-muted">Esta información solo la ven los líderes, para poder ayudarte en caso de emergencia.</p>
        <Field label="Tipo de sangre (RH)" error={errors.blood_type}>
          {(p) => (
            <select {...p} value={bloodType} onChange={(e) => setBloodType(e.target.value as BloodType | '')}>
              <option value="">Elige…</option>
              {BLOOD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Alergias" hint="Medicamentos, alimentos, picaduras… Si no tienes, déjalo vacío.">
          {(p) => <textarea {...p} rows={2} maxLength={1000} value={allergies} onChange={(e) => setAllergies(e.target.value)} />}
        </Field>
        <Field label="Condiciones de salud que debamos saber" hint="Por ejemplo: diabetes, epilepsia, problemas cardíacos, medicación habitual.">
          {(p) => <textarea {...p} rows={2} maxLength={1000} value={conditions} onChange={(e) => setConditions(e.target.value)} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del contacto de emergencia" error={errors.emergency_contact_name}>
            {(p) => <input {...p} maxLength={120} value={contactName} onChange={(e) => setContactName(e.target.value)} />}
          </Field>
          <Field label="Teléfono del contacto de emergencia" error={errors.emergency_contact_phone}>
            {(p) => <input {...p} type="tel" maxLength={40} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />}
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-lg uppercase tracking-wide text-steel">Fotos</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tu foto" error={errors.riderPhoto} hint={hasRiderPhoto ? 'Ya tienes foto; elige otra solo si quieres cambiarla.' : 'Será tu foto de perfil.'}>
            {(p) => <input {...p} ref={riderInput} type="file" accept="image/*" onChange={(e) => setRiderPhoto(e.target.files?.[0] ?? null)} />}
          </Field>
          <Field label="Foto de tu moto" error={errors.motoPhoto} hint={hasMotoPhoto ? 'Ya tienes foto; elige otra solo si quieres cambiarla.' : undefined}>
            {(p) => <input {...p} ref={motoInput} type="file" accept="image/*" onChange={(e) => setMotoPhoto(e.target.files?.[0] ?? null)} />}
          </Field>
        </div>
      </fieldset>

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
