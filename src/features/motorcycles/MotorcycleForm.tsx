import { useRef, useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { isImageFile } from '../../lib/images'
import type { MotorcycleInput } from './api'

type Props = {
  initial?: Partial<Omit<MotorcycleInput, 'photo'>>
  hasPhoto?: boolean
  submitLabel: string
  onSubmit: (input: MotorcycleInput) => Promise<unknown>
  onCancel?: () => void
}

type Errors = { brand?: string; model?: string; photo?: string }

function toNumber(value: string): number | null {
  const n = Number(value.trim())
  return value.trim() && Number.isFinite(n) ? n : null
}

export function MotorcycleForm({ initial, hasPhoto = false, submitLabel, onSubmit, onCancel }: Props) {
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [year, setYear] = useState(initial?.year != null ? String(initial.year) : '')
  const [cc, setCc] = useState(initial?.displacement_cc != null ? String(initial.displacement_cc) : '')
  const [color, setColor] = useState(initial?.color ?? '')
  const [plate, setPlate] = useState(initial?.plate ?? '')
  const [photo, setPhoto] = useState<File | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!brand.trim()) next.brand = 'Escribe la marca.'
    if (!model.trim()) next.model = 'Escribe el modelo.'
    if (photo && !isImageFile(photo)) next.photo = 'Solo se pueden subir imágenes.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await onSubmit({
        brand: brand.trim(),
        model: model.trim(),
        year: toNumber(year),
        displacement_cc: toNumber(cc),
        color: color.trim(),
        plate: plate.trim(),
        photo,
      })
      setPhoto(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <ErrorNote message={formError} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Marca" error={errors.brand}>
          {(p) => <input {...p} maxLength={60} value={brand} onChange={(e) => setBrand(e.target.value)} />}
        </Field>
        <Field label="Modelo" error={errors.model}>
          {(p) => <input {...p} maxLength={60} value={model} onChange={(e) => setModel(e.target.value)} />}
        </Field>
        <Field label="Año (opcional)">
          {(p) => <input {...p} type="number" min={1900} max={2100} value={year} onChange={(e) => setYear(e.target.value)} />}
        </Field>
        <Field label="Cilindraje en cc (opcional)">
          {(p) => <input {...p} type="number" min={1} max={3000} value={cc} onChange={(e) => setCc(e.target.value)} />}
        </Field>
        <Field label="Color (opcional)">
          {(p) => <input {...p} maxLength={40} value={color} onChange={(e) => setColor(e.target.value)} />}
        </Field>
        <Field label="Placa (opcional)">
          {(p) => <input {...p} maxLength={15} value={plate} onChange={(e) => setPlate(e.target.value)} />}
        </Field>
      </div>
      <Field label="Foto (opcional)" error={errors.photo} hint={hasPhoto ? 'Ya tiene foto; elige otra solo si quieres cambiarla.' : undefined}>
        {(p) => <input {...p} ref={fileInput} type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />}
      </Field>
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
