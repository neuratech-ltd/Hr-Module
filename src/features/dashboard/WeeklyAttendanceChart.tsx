import { useMemo, useState } from 'react'
import { endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import { useHR } from '@/store/hr-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { dayStatus, recordOn } from '@/lib/hr'
import { eachDay, toISO, todayISO } from '@/lib/dates'
import { isLate } from '@/lib/format'
import type { Employee } from '@/types'

// Slice colours, in this order, pass the palette validator in light and dark mode
// (no adjacent pair is confusable under colour-blindness; legend carries the counts).
const SLICES = [
  { key: 'onTime', label: 'On time', color: '#059669' },
  { key: 'absent', label: 'Absent', color: '#f43f5e' },
  { key: 'leave', label: 'On leave', color: '#0284c7' },
  { key: 'late', label: 'Late', color: '#d97706' },
] as const
type SliceKey = (typeof SLICES)[number]['key']

const R = 42
const C = 2 * Math.PI * R
const GAP = 2.2 // surface gap between segments, in px along the ring

/** This week's working days as a donut: present on time, late, absent, on leave. */
export function WeeklyAttendanceChart({ employee }: { employee: Employee }) {
  const { data } = useHR()
  const [active, setActive] = useState<SliceKey | null>(null)

  const week = useMemo(() => {
    const now = new Date()
    const start = toISO(startOfWeek(now, { weekStartsOn: 0 }))
    const end = toISO(endOfWeek(now, { weekStartsOn: 0 }))
    const today = todayISO()
    const counts: Record<SliceKey, number> = { onTime: 0, late: 0, absent: 0, leave: 0 }
    let daysOff = 0
    for (const date of eachDay(start, end)) {
      if (date > today) continue
      const s = dayStatus(data, employee, date)
      if (s === 'PRESENT') {
        const rec = recordOn(data, employee.id, date)
        counts[isLate(rec?.check_in ?? null, data.settings.office_start_time) ? 'late' : 'onTime']++
      } else if (s === 'ABSENT') counts.absent++
      else if (s === 'LEAVE') counts.leave++
      else if (s === 'WEEKEND' || s === 'HOLIDAY') daysOff++
    }
    return { start, end, counts, daysOff }
  }, [data, employee])

  const total = SLICES.reduce((n, s) => n + week.counts[s.key], 0)
  const present = week.counts.onTime + week.counts.late
  const shown = active ? SLICES.find((s) => s.key === active)! : null

  // Ring segments (with a small gap between neighbours).
  const filled = SLICES.filter((s) => week.counts[s.key] > 0)
  const segments = filled.map((s, i) => {
    const len = (week.counts[s.key] / total) * C
    const offset = filled.slice(0, i).reduce((n, p) => n + (week.counts[p.key] / total) * C, 0)
    return { ...s, dash: Math.max(0, len - (filled.length === 1 ? 0 : GAP)), offset }
  })

  const range = `${format(parseISO(week.start), 'd MMM')} – ${format(parseISO(week.end), 'd MMM')}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly attendance</CardTitle>
        <CardDescription>{range}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
        <div className="relative size-44 shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="size-full -rotate-90"
            role="img"
            aria-label={`This week: ${SLICES.map((s) => `${s.label} ${week.counts[s.key]}`).join(', ')}`}
          >
            <circle cx="50" cy="50" r={R} fill="none" strokeWidth="12" className="stroke-muted" />
            {segments.map((s) => (
              <circle
                key={s.key}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={active === s.key ? 14 : 12}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                className={cn('cursor-pointer transition-[stroke-width,opacity] duration-150', active && active !== s.key && 'opacity-40')}
                onMouseEnter={() => setActive(s.key)}
                onMouseLeave={() => setActive(null)}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            {total === 0 ? (
              <>
                <p className="text-sm font-medium">No working days yet</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </>
            ) : shown ? (
              <>
                <p className="text-2xl font-semibold tabular-nums">{week.counts[shown.key]}</p>
                <p className="text-xs text-muted-foreground">{shown.label}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Present</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {present}
                  <span className="text-base text-muted-foreground">/{total}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">{format(new Date(), 'd/M/yyyy')}</p>
              </>
            )}
          </div>
        </div>

        <ul className="grid w-full max-w-56 gap-1">
          {SLICES.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                onMouseEnter={() => setActive(s.key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(s.key)}
                onBlur={() => setActive(null)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm outline-none transition-colors',
                  active === s.key ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums">{week.counts[s.key]}</span>
              </button>
            </li>
          ))}
          <li className="mt-1 border-t px-2 pt-2 text-xs text-muted-foreground">
            {week.daysOff} weekend / holiday {week.daysOff === 1 ? 'day' : 'days'} not counted
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
