import { CalendarOff, CircleCheck, Clock, LogIn, LogOut, Palmtree, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useHR } from '@/store/hr-store'
import { ToneBadge } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { approvedLeaveOn, dayStatus, holidayOn, leaveTypeName, recordOn } from '@/lib/hr'
import { fmtTime, todayISO } from '@/lib/dates'
import type { Employee } from '@/types'
import { fmtClock, isLate, workedDuration } from '@/lib/format'
import { useNow } from '@/hooks/useNow'

/** One-click Check In / Check Out for today (SRS 4.2). */
export function CheckInCard({ employee }: { employee: Employee }) {
  const { data, checkIn, checkOut } = useHR()
  useNow()
  const today = todayISO()
  const record = recordOn(data, employee.id, today)
  const status = dayStatus(data, employee, today)
  const officeStart = data.settings.office_start_time
  const holiday = holidayOn(data, today)
  const leave = approvedLeaveOn(data, employee.id, today)

  const run = (fn: () => void, ok: string) => {
    try {
      fn()
      toast.success(ok)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // Days off replace the check-in button.
  const off =
    !record &&
    (status === 'LEAVE'
      ? { icon: Palmtree, title: "You're on leave today", text: leave ? `${leaveTypeName(data, leave.leave_type)} · enjoy your time off.` : '' }
      : status === 'HOLIDAY'
        ? { icon: PartyPopper, title: holiday?.name ?? 'Holiday', text: 'The office is closed today.' }
        : status === 'WEEKEND'
          ? { icon: CalendarOff, title: "It's the weekend", text: 'No check-in needed today.' }
          : null)

  const late = isLate(record?.check_in ?? null, officeStart)

  let headline: string
  let sub: string
  if (record?.check_out) {
    headline = `Checked out at ${fmtTime(record.check_out)}`
    sub = `Worked ${workedDuration(record.check_in, record.check_out)} · in at ${fmtTime(record.check_in)}`
  } else if (record?.check_in) {
    headline = `Checked in at ${fmtTime(record.check_in)}`
    sub = `${workedDuration(record.check_in)} so far`
  } else if (record) {
    headline = record.status === 'PRESENT' ? 'Marked present by HR' : 'Marked absent by HR'
    sub = record.remarks || 'Contact HR if this looks wrong.'
  } else {
    headline = 'Not checked in yet'
    sub = `Office starts at ${fmtClock(officeStart)}`
  }

  return (
    <Card className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary" />
      <CardContent className="flex flex-col gap-5 px-5 py-1 sm:flex-row sm:items-center sm:justify-between">
        {off ? (
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <off.icon className="size-6" />
            </span>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Today</p>
              <p className="mt-0.5 text-lg font-semibold">{off.title}</p>
              {off.text && <p className="text-sm text-muted-foreground">{off.text}</p>}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  'grid size-12 shrink-0 place-items-center rounded-2xl',
                  record?.check_out
                    ? 'bg-muted text-muted-foreground'
                    : record
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'bg-primary/10 text-primary',
                )}
              >
                {record ? <CircleCheck className="size-6" /> : <Clock className="size-6" />}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Today</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-lg font-semibold">
                  {headline}
                  {late && <ToneBadge tone="amber">Late</ToneBadge>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sub}
                  {late && ` · office starts ${fmtClock(officeStart)}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {!record && (
                <Button size="lg" className="h-11 w-full px-6 text-base sm:w-auto" onClick={() => run(() => checkIn(employee.id), 'Checked in. Have a great day!')}>
                  <LogIn />
                  Check in
                </Button>
              )}
              {record?.check_in && !record.check_out && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 w-full px-6 text-base sm:w-auto"
                  onClick={() => run(() => checkOut(employee.id), 'Checked out. See you tomorrow!')}
                >
                  <LogOut />
                  Check out
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
