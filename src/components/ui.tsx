import { useEffect, useId, useState, type ButtonHTMLAttributes, type ImgHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none motion-reduce:transform-none motion-reduce:transition-colors'
const variants: Record<Variant, string> = {
  primary: 'bg-red text-ink hover:bg-red-hover hover:shadow-[0_6px_20px_-6px_rgba(212,10,10,0.6)]',
  secondary: 'bg-gunmetal text-ink hover:bg-gunmetal-dark border border-gunmetal hover:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)]',
  ghost: 'border border-line text-ink hover:bg-surface-2 hover:border-steel',
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

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  const interactive = hover
    ? 'transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-line hover:shadow-[0_14px_34px_-18px_rgba(0,0,0,0.85)] motion-reduce:transform-none'
    : ''
  return <div className={`rounded-lg border border-surface-2 bg-surface p-4 ${interactive} ${className}`}>{children}</div>
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

type Tone = 'neutral' | 'red' | 'gunmetal' | 'silver' | 'green'
const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-steel',
  red: 'bg-red-dark text-ink',
  gunmetal: 'bg-gunmetal text-steel',
  silver: 'bg-silver text-bg',
  green: 'bg-emerald-900 text-emerald-200',
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
    <div role="status" className="flex animate-fade-in items-center justify-center gap-3 py-12 text-muted">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-surface-2 border-t-red border-r-red/50" />
      <span>{label}</span>
    </div>
  )
}

/** Barra de carga con brillo, para armar esqueletos de contenido. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton block ${className}`} aria-hidden="true" />
}

/** Tarjeta-esqueleto que imita una fila con avatar y dos líneas de texto. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando…" className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-surface-2 bg-surface p-4">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Cuadrícula de tarjetas-esqueleto (imagen + dos líneas), para páginas con tarjetas. */
export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando…" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-surface-2 bg-surface">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Imagen que aparece con un fundido al terminar de cargar. */
export function FadeImg({ className = '', onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      {...props}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
      className={`img-fade ${loaded ? 'is-loaded' : ''} ${className}`}
    />
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
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90dvh] w-full animate-scale-in overflow-auto rounded-lg border border-line bg-surface p-4 shadow-2xl shadow-black/60 ${wide ? 'max-w-5xl' : 'max-w-md'}`}
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
