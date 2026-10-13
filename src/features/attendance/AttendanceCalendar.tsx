import { useMemo, useState } from 'react'
import { addMonths, endOfMonth, format, getDay, isSameMonth, parseISO, startOfMonth, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { dayStatusMeta } from '@/components/common'
import { useHR } from '@/store/hr-store'
import { dayStatus, holidayOn, recordOn } from '@/lib/hr'
import { eachDay, fmtTime, toISO, todayISO } from '@/lib/dates'
import type { DayStatus, Employee } from '@/types'

export interface MonthSummary {
  present: number
  absent: number
  leave: number
  workingDays: number
}

/** Present / absent / leave counts for one employee in one month (up to today). */
export function useMonthAttendance(employee: Employee, month: Date) {
  const { data } = useHR()
  return useMemo(() => {
    const days = eachDay(toISO(startOfMonth(month)), toISO(endOfMonth(month))).map((date) => ({
      date,
      status: dayStatus(data, employee, date),
    }))
    const count = (s: DayStatus) => days.filter((d) => d.status === s).length
    const summary: MonthSummary = {
      present: count('PRESENT'),
      absent: count('ABSENT'),
      leave: count('LEAVE'),
      workingDays: count('PRESENT') + count('ABSENT') + count('LEAVE') + count('NOT_MARKED'),
    }
    return { days, summary }
  }, [data, employee, month])
}

const LEGEND: DayStatus[] = ['PRESENT', 'ABSENT', 'LEAVE', 'HOLIDAY', 'WEEKEND']

/** Month grid colour-coded by attendance status, with prev/next navigation. */
export function AttendanceCalendar({
  employee,
  month: controlledMonth,
  onMonthChange,
}: {
  employee: Employee
  month?: Date
  onMonthChange?: (m: Date) => void
}) {
  const { data } = useHR()
  const [innerMonth, setInnerMonth] = useState(() => startOfMonth(new Date()))
  const month = controlledMonth ?? innerMonth
  const setMonth = (m: Date) => (onMonthChange ? onMonthChange(m) : setInnerMonth(m))
  const { days } = useMonthAttendance(employee, month)
  const today = todayISO()
  const lead = getDay(startOfMonth(month))
  const canGoNext = !isSameMonth(month, new Date())

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-medium">{format(month, 'MMMM yyyy')}</p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canGoNext}
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="pb-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: lead }, (_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {days.map(({ date, status }) => {
          const meta = dayStatusMeta[status]
          const record = recordOn(data, employee.id, date)
          const holiday = holidayOn(data, date)
          const tip =
            status === 'PRESENT' && record
              ? `Present · In ${fmtTime(record.check_in)}${record.check_out ? ` · Out ${fmtTime(record.check_out)}` : ''}`
              : status === 'HOLIDAY'
                ? holiday?.name
                : status === 'UPCOMING'
                  ? undefined
                  : meta.label + (record?.remarks ? ` · ${record.remarks}` : '')
          const cell = (
            <div
              className={cn(
                'relative flex h-11 flex-col items-center justify-center rounded-lg text-sm tabular-nums transition-colors sm:h-14',
                status === 'PRESENT' && 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
                status === 'ABSENT' && 'bg-rose-500/10 text-rose-800 dark:text-rose-300',
                status === 'LEAVE' && 'bg-sky-500/10 text-sky-800 dark:text-sky-300',
                status === 'HOLIDAY' && 'bg-violet-500/10 text-violet-800 dark:text-violet-300',
                status === 'WEEKEND' && 'text-muted-foreground/60',
                status === 'NOT_MARKED' && 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
                status === 'UPCOMING' && 'text-muted-foreground',
                date === today && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
              )}
            >
              {format(parseISO(date), 'd')}
              {status !== 'UPCOMING' && status !== 'WEEKEND' && (
                <span className={cn('absolute bottom-1 size-1 sm:bottom-1.5 rounded-full', meta.dot)} />
              )}
            </div>
          )
          return tip ? (
            <Tooltip key={date}>
              <TooltipTrigger render={cell} />
              <TooltipContent>{tip}</TooltipContent>
            </Tooltip>
          ) : (
            <div key={date}>{cell}</div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {LEGEND.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', dayStatusMeta[s].dot)} />
            {dayStatusMeta[s].label}
          </span>
        ))}
      </div>
    </div>
  )
}
