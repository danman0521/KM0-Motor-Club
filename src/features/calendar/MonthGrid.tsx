import { Link } from 'react-router-dom'
import { buildMonthGrid, isSameDay } from '../../lib/dates'
import type { EventRow } from '../../lib/supabase'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Cuadrícula mensual; los días con evento enlazan a su detalle. */
export function MonthGrid({
  year,
  monthIndex,
  events,
  today,
}: {
  year: number
  monthIndex: number
  events: EventRow[]
  today: Date
}) {
  const weeks = buildMonthGrid(year, monthIndex)
  const dated = events.map((e) => ({ event: e, date: new Date(e.starts_at) }))

  return (
    <div className="overflow-hidden rounded-lg border border-surface-2">
      <div className="grid grid-cols-7 bg-navy text-center font-display text-xs uppercase tracking-wide text-steel sm:text-sm">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0].toISOString()} className="grid grid-cols-7 border-t border-surface-2">
          {week.map((day) => {
            const inMonth = day.getMonth() === monthIndex
            const isToday = isSameDay(day, today)
            const dayEvents = dated.filter((d) => isSameDay(d.date, day))
            return (
              <div
                key={day.toISOString()}
                className={`min-h-16 border-l border-surface-2 p-1 first:border-l-0 sm:min-h-24 sm:p-2 ${inMonth ? 'bg-surface' : 'bg-bg'}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs sm:text-sm ${
                    isToday ? 'bg-cream font-bold text-bg' : inMonth ? 'text-ink' : 'text-line'
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map(({ event }) => (
                    <Link
                      key={event.id}
                      to={`/eventos/${event.id}`}
                      title={event.title}
                      className="block truncate rounded bg-red px-1 py-0.5 text-[10px] font-semibold leading-tight hover:bg-red-hover sm:text-xs"
                    >
                      {event.title}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
