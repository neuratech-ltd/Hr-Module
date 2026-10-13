import { differenceInMinutes, format, parseISO } from 'date-fns'

/** "7h 32m" between two ISO timestamps (end defaults to now). */
export function workedDuration(start: string | null, end?: string | null): string {
  if (!start) return '—'
  const mins = Math.max(0, differenceInMinutes(end ? parseISO(end) : new Date(), parseISO(start)))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

/** Leave day count for display: 0.5 → "½ day", 1 → "1 day", 2.5 → "2.5 days". */
export function fmtDays(n: number): string {
  if (n === 0.5) return '½ day'
  return `${n} ${n === 1 ? 'day' : 'days'}`
}

/** Was this check-in after the office start time ("HH:mm")? */
export function isLate(checkIn: string | null, officeStart: string): boolean {
  return !!checkIn && format(parseISO(checkIn), 'HH:mm') > officeStart
}

/** "09:00" → "09:00 AM" */
export function fmtClock(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number)
  return format(new Date(2000, 0, 1, h, m), 'hh:mm a')
}

/** Short date range: "12 Oct 2026" or "12 Oct – 14 Oct 2026". */
export function fmtRange(start: string, end: string): string {
  if (start === end) return format(parseISO(start), 'dd MMM yyyy')
  const s = parseISO(start)
  const e = parseISO(end)
  return s.getFullYear() === e.getFullYear()
    ? `${format(s, 'dd MMM')} – ${format(e, 'dd MMM yyyy')}`
    : `${format(s, 'dd MMM yyyy')} – ${format(e, 'dd MMM yyyy')}`
}
