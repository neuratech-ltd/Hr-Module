import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarOff, LogIn, LogOut, Palmtree, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useHR } from '@/store/hr-store'
import { ToneBadge } from '@/components/common'
import { Card } from '@/components/ui/card'
import { approvedLeaveOn, dayStatus, holidayOn, leaveTypeName, recordOn } from '@/lib/hr'
import { fmtTime, todayISO } from '@/lib/dates'
import type { Employee } from '@/types'
import { fmtClock, isLate, workedDuration } from '@/lib/format'

/** Ticks every second for the live clock. */
function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

/** One-click In time / Out time for today (SRS 4.2). */
export function CheckInCard({ employee }: { employee: Employee }) {
  const { data, checkIn, checkOut } = useHR()
  const now = useClock()
  const today = todayISO()
  const record = recordOn(data, employee.id, today)
  const status = dayStatus(data, employee, today)
  const officeStart = data.settings.office_start_time
  const holiday = holidayOn(data, today)
  const leave = approvedLeaveOn(data, employee.id, today)
  const late = isLate(record?.check_in ?? null, officeStart)

  const run = (fn: () => void, ok: string) => {
    try {
      fn()
      toast.success(ok)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // Days off replace the buttons.
  const off =
    !record &&
    (status === 'LEAVE'
      ? { icon: Palmtree, title: "You're on leave today", text: leave ? leaveTypeName(data, leave.leave_type) : '' }
      : status === 'HOLIDAY'
        ? { icon: PartyPopper, title: holiday?.name ?? 'Holiday', text: 'The office is closed today.' }
        : status === 'WEEKEND'
          ? { icon: CalendarOff, title: "It's the weekend", text: 'No check-in needed today.' }
          : null)

  const statusLine = record?.check_out
    ? `Worked ${workedDuration(record.check_in, record.check_out)} today`
    : record?.check_in
      ? `${workedDuration(record.check_in)} so far`
      : record
        ? record.status === 'PRESENT'
          ? 'Marked present by HR'
          : 'Marked absent by HR'
        : `Office starts at ${fmtClock(officeStart)}`

  const canIn = !record && !off
  const canOut = !!record?.check_in && !record.check_out

  return (
    <Card className="gap-0 py-0 shadow-lg shadow-hero/10">
      <div className="flex flex-col items-center gap-1 px-5 pt-6 pb-5 text-center">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{format(now, 'EEEE, d MMMM')}</p>
        <p className="font-heading text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl" aria-live="off">
          {format(now, 'hh:mm')}
          <span className="text-muted-foreground/60">:{format(now, 'ss')}</span>
          <span className="ml-1.5 text-base font-medium text-muted-foreground sm:text-lg">{format(now, 'a')}</span>
        </p>
        {off ? (
          <div className="mt-2 flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary">
            <off.icon className="size-4" />
            <span className="font-medium">{off.title}</span>
            {off.text && <span className="text-primary/70">· {off.text}</span>}
          </div>
        ) : (
          <p className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            {statusLine}
            {late && <ToneBadge tone="amber">Late</ToneBadge>}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 border-t">
        <PunchButton
          icon={LogIn}
          label="In time"
          value={record?.check_in ? fmtTime(record.check_in) : null}
          enabled={canIn}
          onClick={() => run(() => checkIn(employee.id), 'Checked in. Have a great day!')}
        />
        <PunchButton
          icon={LogOut}
          label="Out time"
          value={record?.check_out ? fmtTime(record.check_out) : null}
          enabled={canOut}
          onClick={() => run(() => checkOut(employee.id), 'Checked out. See you tomorrow!')}
          className="border-l"
        />
      </div>
    </Card>
  )
}

function PunchButton({
  icon: Icon,
  label,
  value,
  enabled,
  onClick,
  className,
}: {
  icon: typeof LogIn
  label: string
  value: string | null
  enabled: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center justify-center gap-1 py-4 transition-colors outline-none focus-visible:bg-accent disabled:cursor-default',
        enabled && 'hover:bg-accent',
        className,
      )}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={cn(
            'grid size-7 place-items-center rounded-full transition-colors',
            enabled ? 'bg-primary text-primary-foreground' : value ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className={cn(enabled || value ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">{value ?? (enabled ? 'Tap to record' : '—')}</span>
    </button>
  )
}
