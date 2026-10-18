import { useMemo, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
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

const R = 46 // pie radius in a 100x100 viewBox

/** SVG path for a pie wedge from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise). */
function wedge(a0: number, a1: number) {
  const pt = (a: number) => `${50 + R * Math.sin(a)} ${50 - R * Math.cos(a)}`
  return `M 50 50 L ${pt(a0)} A ${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${pt(a1)} Z`
}

/** The last 7 days' working days as a pie: on time, absent, on leave, late. */
export function WeeklyAttendanceChart({ employee }: { employee: Employee }) {
  const { data } = useHR()
  const [active, setActive] = useState<SliceKey | null>(null)

  const week = useMemo(() => {
    // Rolling last 7 days, ending today.
    const today = todayISO()
    const start = toISO(subDays(parseISO(today), 6))
    const end = today
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

  // Pie wedges, clockwise from 12 o'clock.
  const filled = SLICES.filter((s) => week.counts[s.key] > 0)
  const wedges = filled.map((s, i) => {
    const before = filled.slice(0, i).reduce((n, p) => n + week.counts[p.key], 0)
    const a0 = (before / total) * 2 * Math.PI
    const a1 = ((before + week.counts[s.key]) / total) * 2 * Math.PI
    const mid = (a0 + a1) / 2
    return { ...s, a0, a1, dx: Math.sin(mid) * 3, dy: -Math.cos(mid) * 3 }
  })
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  const range = `${format(parseISO(week.start), 'd MMM')} – ${format(parseISO(week.end), 'd MMM')}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly attendance</CardTitle>
        <CardDescription>Last 7 days · {range}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <p className="h-10 text-center text-sm leading-tight" aria-live="polite">
            {total === 0 ? (
              <span className="text-muted-foreground">No working days in the last 7 days</span>
            ) : shown ? (
              <>
                <span className="block font-semibold">{shown.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {week.counts[shown.key]} {week.counts[shown.key] === 1 ? 'day' : 'days'} · {pct(week.counts[shown.key])}%
                </span>
              </>
            ) : (
              <>
                <span className="block font-semibold text-emerald-700 dark:text-emerald-400">Present</span>
                <span className="text-muted-foreground tabular-nums">
                  {present} of {total} working {total === 1 ? 'day' : 'days'}
                </span>
              </>
            )}
          </p>
          <svg
            viewBox="-4 -4 108 108"
            className="size-44 overflow-visible"
            role="img"
            aria-label={`Last 7 days: ${SLICES.map((s) => `${s.label} ${week.counts[s.key]}`).join(', ')}`}
          >
            {total === 0 ? (
              <circle cx="50" cy="50" r={R} className="fill-muted" />
            ) : wedges.length === 1 ? (
              <circle
                cx="50"
                cy="50"
                r={R}
                fill={wedges[0]!.color}
                className="cursor-pointer"
                onMouseEnter={() => setActive(wedges[0]!.key)}
                onMouseLeave={() => setActive(null)}
              />
            ) : (
              wedges.map((w) => (
                <path
                  key={w.key}
                  d={wedge(w.a0, w.a1)}
                  fill={w.color}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  className={cn(
                    'cursor-pointer stroke-card transition-[transform,opacity] duration-150',
                    active && active !== w.key && 'opacity-40',
                  )}
                  style={{ transform: active === w.key ? `translate(${w.dx}px, ${w.dy}px)` : undefined }}
                  onMouseEnter={() => setActive(w.key)}
                  onMouseLeave={() => setActive(null)}
                />
              ))
            )}
          </svg>
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
