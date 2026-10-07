const STARS = [1, 2, 3, 4, 5]

/** Selector de 1 a 5 estrellas. */
export function StarRating({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null
  onChange: (stars: number) => void
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Tu calificación" className="flex gap-1">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={star === 1 ? '1 estrella' : `${star} estrellas`}
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`text-3xl leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            value !== null && star <= value ? 'text-silver' : 'text-line hover:text-steel'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

/** Promedio de solo lectura, p. ej. "★ 4,5 (6 votos)". */
export function RatingSummary({ average, count }: { average: number; count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center gap-1 text-sm text-steel">
      <span className="text-silver" aria-hidden>
        ★
      </span>
      <span>
        {average.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
        <span className="text-muted">
          ({count} {count === 1 ? 'voto' : 'votos'})
        </span>
      </span>
    </span>
  )
}
