import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
const variants: Record<Variant, string> = {
  primary: 'bg-red text-ink hover:bg-red-hover',
  secondary: 'bg-gunmetal text-ink hover:bg-gunmetal-dark border border-gunmetal',
  ghost: 'border border-line text-ink hover:bg-surface-2',
  danger: 'border border-red-dark text-red-hover hover:bg-red-dark hover:text-ink',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function ButtonLink({ variant = 'primary', className = '', ...props }: LinkProps & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-surface-2 bg-surface p-4 ${className}`}>{children}</div>
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-red pb-3">
      <h1 className="text-3xl font-bold">{children}</h1>
      {action}
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-line bg-bg px-3 py-2 text-ink placeholder:text-muted focus:border-steel focus:outline-none'

type FieldProps = {
  label: string
  error?: string
  hint?: string
  /** Recibe el id y los atributos de accesibilidad para el control */
  children: (props: { id: string; className: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Etiqueta + control + mensaje de error junto al campo. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-steel">
        {label}
      </label>
      {children({
        id,
        className: `${inputClass} ${error ? 'border-red-hover' : ''}`,
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : undefined,
      })}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="text-sm text-red-hover">
          {error}
        </p>
      )}
    </div>
  )
}

type Tone = 'neutral' | 'red' | 'gunmetal' | 'silver'
const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-steel',
  red: 'bg-red-dark text-ink',
  gunmetal: 'bg-gunmetal text-steel',
  silver: 'bg-silver text-bg',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-red" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-dark bg-red-dark/20 px-4 py-3 text-sm">
      <span>{message}</span>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-muted">{children}</p>
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90dvh] w-full overflow-auto rounded-lg border border-line bg-surface p-4 ${wide ? 'max-w-5xl' : 'max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded px-2 py-1 text-xl text-muted hover:text-ink">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
