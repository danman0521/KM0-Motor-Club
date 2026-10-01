import { useId, useRef, useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { isImageFile } from '../../lib/images'
import { normalizeHttpUrl } from '../../lib/url'
import type { PartnerInput } from './api'

type Props = {
  initial?: Partial<Omit<PartnerInput, 'logo'>>
  hasLogo?: boolean
  submitLabel: string
  onSubmit: (input: PartnerInput) => Promise<unknown>
  onCancel?: () => void
}

type Errors = { name?: string; benefit?: string; website?: string; logo?: string }

export function PartnerForm({ initial, hasLogo = false, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [benefit, setBenefit] = useState(initial?.benefit ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [validUntil, setValidUntil] = useState(initial?.valid_until ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [logo, setLogo] = useState<File | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const activeId = useId()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!name.trim()) next.name = 'Escribe el nombre de la empresa.'
    if (!benefit.trim()) next.benefit = 'Escribe el beneficio para los miembros.'
    const url = website.trim() ? normalizeHttpUrl(website) : null
    if (website.trim() && !url) next.website = 'Ese enlace no es válido.'
    if (logo && !isImageFile(logo)) next.logo = 'Solo se pueden subir imágenes.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await onSubmit({
        name: name.trim(),
        category: category.trim(),
        benefit: benefit.trim(),
        description: description.trim(),
        phone: phone.trim(),
        address: address.trim(),
        website: url,
        valid_until: validUntil || null,
        active,
        logo,
      })
      setLogo(null)
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
        <Field label="Empresa" error={errors.name}>
          {(p) => <input {...p} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Categoría" hint="Por ejemplo: Talleres, Repuestos, Comida.">
          {(p) => <input {...p} maxLength={60} value={category} onChange={(e) => setCategory(e.target.value)} />}
        </Field>
      </div>
      <Field label="Beneficio" error={errors.benefit} hint="Lo que obtiene el miembro: «10 % de descuento en repuestos».">
        {(p) => <input {...p} maxLength={300} value={benefit} onChange={(e) => setBenefit(e.target.value)} />}
      </Field>
      <Field label="Descripción" hint="Condiciones y cómo hacer válido el beneficio.">
        {(p) => <textarea {...p} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono">{(p) => <input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
        <Field label="Dirección">{(p) => <input {...p} value={address} onChange={(e) => setAddress(e.target.value)} />}</Field>
        <Field label="Sitio web" error={errors.website}>
          {(p) => <input {...p} inputMode="url" placeholder="https://…" value={website} onChange={(e) => setWebsite(e.target.value)} />}
        </Field>
        <Field label="Vigente hasta (opcional)">
          {(p) => <input {...p} type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />}
        </Field>
      </div>
      <Field label="Logo" error={errors.logo} hint={hasLogo ? 'Ya tiene logo; elige otro solo si quieres cambiarlo.' : undefined}>
        {(p) => <input {...p} ref={fileInput} type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />}
      </Field>
      <div className="flex items-center gap-2">
        <input id={activeId} type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-red" />
        <label htmlFor={activeId} className="text-sm">
          Visible para los miembros
        </label>
      </div>
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
