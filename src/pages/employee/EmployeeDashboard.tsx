import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO, startOfMonth } from 'date-fns'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  CircleX,
  Palmtree,
  Percent,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { useMonthAttendance } from '@/components/AttendanceCalendar'
import { EmptyState, LeaveStatusBadge, PageHeader, StatCard, ToneBadge } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { leaveBalances, leaveTypeName } from '@/lib/hr'
import { todayISO } from '@/lib/dates'
import type { Employee } from '@/types'
import { fmtDays, fmtRange } from './utils'
import { useNow } from './useNow'
import { CheckInCard } from './CheckInCard'

function greeting(d: Date) {
  const h = d.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function EmployeeDashboard() {
  const { employee } = useAuth()
  if (!employee) return null
  return <Dashboard employee={employee} />
}

function Dashboard({ employee }: { employee: Employee }) {
  const now = useNow()
  const firstName = employee.full_name.split(' ')[0]
  return (
    <>
      <PageHeader title={`${greeting(now)}, ${firstName}`} description={format(now, 'EEEE, d MMMM yyyy')} />
      <div className="grid gap-6">
        <CheckInCard employee={employee} />
        <MonthStats employee={employee} />
        <div className="grid gap-6 lg:grid-cols-2">
          <BalanceCard employee={employee} />
          <UpcomingCard employee={employee} />
        </div>
      </div>
    </>
  )
}

function MonthStats({ employee }: { employee: Employee }) {
  const [month] = useState(() => startOfMonth(new Date()))
  const { summary } = useMonthAttendance(employee, month)
  const counted = summary.present + summary.absent
  const rate = counted ? Math.round((summary.present / counted) * 100) : null
  const label = format(month, 'MMMM')
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">This month · {label}</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Present" value={summary.present} icon={CircleCheck} tone="green" hint="days" />
        <StatCard label="Absent" value={summary.absent} icon={CircleX} tone="red" hint="days" />
        <StatCard label="On leave" value={summary.leave} icon={Palmtree} tone="blue" hint="days" />
        <StatCard
          label="Attendance rate"
          value={rate === null ? '—' : `${rate}%`}
          icon={Percent}
          tone="violet"
          hint={`of ${counted} working day${counted === 1 ? '' : 's'} so far`}
        />
      </div>
    </div>
  )
}

function BalanceCard({ employee }: { employee: Employee }) {
  const { data } = useHR()
  const balances = useMemo(() => leaveBalances(data, employee), [data, employee])
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave balance</CardTitle>
        <CardDescription>{new Date().getFullYear()} allocation</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link to="/leave/apply" />}>
            Apply for leave
            <ArrowRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        {balances.length === 0 && <EmptyState icon={CalendarDays} title="No leave types configured" />}
        {balances.map((b) => {
          const pct = b.allocated ? Math.max(0, Math.min(100, (b.remaining / b.allocated) * 100)) : 0
          return (
            <div key={b.leave_type.id}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{b.leave_type.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  <span className="font-medium text-foreground">{b.remaining}</span> / {b.allocated}
                  {b.pending > 0 && <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">{b.pending} pending</span>}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function UpcomingCard({ employee }: { employee: Employee }) {
  const { data } = useHR()
  const today = todayISO()
  const holidays = data.holidays
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
  const leaves = data.leaveRequests
    .filter((l) => l.employee === employee.id && (l.status === 'PENDING' || l.status === 'APPROVED') && l.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const empty = holidays.length === 0 && leaves.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming</CardTitle>
        <CardDescription>Your time off and the next public holidays</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyState icon={CalendarClock} title="Nothing coming up" description="Approved leave and holidays will appear here." />
        ) : (
          <ul className="grid gap-1">
            {leaves.map((l) => (
              <li key={`l-${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                <DateChip date={l.start_date} tone="blue" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{leaveTypeName(data, l.leave_type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtRange(l.start_date, l.end_date)} · {fmtDays(l.total_days)}
                  </p>
                </div>
                <LeaveStatusBadge status={l.status} />
              </li>
            ))}
            {holidays.map((h) => (
              <li key={`h-${h.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                <DateChip date={h.date} tone="violet" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(h.date), 'EEEE')}</p>
                </div>
                <ToneBadge tone="violet">Holiday</ToneBadge>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" render={<Link to="/attendance" />}>
            <CalendarCheck2 />
            View my calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DateChip({ date, tone }: { date: string; tone: 'blue' | 'violet' }) {
  const d = parseISO(date)
  return (
    <span
      className={cn(
        'grid w-11 shrink-0 place-items-center rounded-lg py-1 text-center leading-tight',
        tone === 'blue' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400' : 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
      )}
    >
      <span className="text-[10px] font-medium uppercase">{format(d, 'MMM')}</span>
      <span className="text-base font-semibold tabular-nums">{format(d, 'd')}</span>
    </span>
  )
}
