import { addDays, format, isAfter, isBefore, parseISO } from 'date-fns'

export const ISO = 'yyyy-MM-dd'

export const toISO = (d: Date) => format(d, ISO)
export const todayISO = () => toISO(new Date())

export const fmtDate = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), 'dd MMM yyyy') : '—'

export const fmtTime = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), 'hh:mm a') : '—'

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), 'dd MMM yyyy, hh:mm a') : '—'

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Every ISO date from start to end, inclusive. */
export function eachDay(start: string, end: string): string[] {
  const out: string[] = []
  let d = parseISO(start)
  const last = parseISO(end)
  while (!isAfter(d, last)) {
    out.push(toISO(d))
    d = addDays(d, 1)
  }
  return out
}

export const isPast = (iso: string) => isBefore(parseISO(iso), parseISO(todayISO()))
