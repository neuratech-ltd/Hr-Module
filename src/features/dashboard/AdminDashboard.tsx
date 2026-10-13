import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO, subDays } from 'date-fns'
import {
  ArrowRight,
  CalendarRange,
  ClipboardCheck,
  Palmtree,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHR } from '@/store/hr-store'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DayStatusBadge,
  EmptyState,
  PageHeader,
  PersonAvatar,
  StatCard,
  dayStatusMeta,
} from '@/components/common'
import { dayStatus, departmentName, designationTitle, employeeById, isWorkingDay, leaveTypeName } from '@/lib/hr'
import { fmtDate, toISO, todayISO } from '@/lib/dates'
import type { DayStatus } from '@/types'
import { SetupChecklist } from './SetupChecklist'

interface DayBar {
  date: string
  present: number
  leave: number
  absent: number
  notMarked: number
  total: number
}

const SERIES = [
  { key: 'present', status: 'PRESENT' },
  { key: 'leave', status: 'LEAVE' },
  { key: 'absent', status: 'ABSENT' },
  { key: 'notMarked', status: 'NOT_MARKED' },
] as const satisfies readonly { key: keyof DayBar; status: DayStatus }[]

export function AdminDashboard() {
  const { data } = useHR()
  const today = todayISO()

  const active = useMemo(() => data.employees.filter((e) => e.status === 'ACTIVE'), [data.employees])

  const todayStatuses = useMemo(
    () => active.map((employee) => ({ employee, status: dayStatus(data, employee, today) })),
    [active, data, today],
  )
  const countToday = (s: DayStatus) => todayStatuses.filter((t) => t.status === s).length
  const presentToday = countToday('PRESENT')
  const absentToday = countToday('ABSENT')
  const notMarkedToday = countToday('NOT_MARKED')
  const leaveToday = countToday('LEAVE')

  const pending = useMemo(
    () =>
      data.leaveRequests
        .filter((l) => l.status === 'PENDING')
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [data.leaveRequests],
  )

  // Last 7 working days, ending today.
  const bars = useMemo<DayBar[]>(() => {
    const days: string[] = []
    let cursor = parseISO(today)
    for (let guard = 0; days.length < 7 && guard < 60; guard++) {
      const iso = toISO(cursor)
      if (isWorkingDay(data, iso)) days.unshift(iso)
      cursor = subDays(cursor, 1)
    }
    return days.map((date) => {
      const bar: DayBar = { date, present: 0, leave: 0, absent: 0, notMarked: 0, total: 0 }
      for (const e of active) {
        const s = dayStatus(data, e, date)
        if (s === 'PRESENT') bar.present++
        else if (s === 'LEAVE') bar.leave++
        else if (s === 'ABSENT') bar.absent++
        else if (s === 'NOT_MARKED') bar.notMarked++
        else continue
        bar.total++
      }
      return bar
    })
  }, [active, data, today])

  const maxTotal = Math.max(1, ...bars.map((b) => b.total))
  const avgRate = (() => {
    const p = bars.reduce((n, b) => n + b.present, 0)
    const t = bars.reduce((n, b) => n + b.present + b.absent + b.notMarked, 0)
    return t ? Math.round((p / t) * 100) : 0
  })()

  const absentees = todayStatuses.filter((t) => t.status === 'ABSENT' || t.status === 'NOT_MARKED')

  const upcomingHolidays = useMemo(
    () =>
      data.holidays
        .filter((h) => h.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [data.holidays, today],
  )

  const headcount = useMemo(() => {
    const rows = data.departments
      .map((d) => ({ dept: d, count: active.filter((e) => e.department === d.id).length }))
      .sort((a, b) => b.count - a.count)
    return { rows, max: Math.max(1, ...rows.map((r) => r.count)) }
  }, [data.departments, active])

  return (
    <div>
      <PageHeader title="Dashboard" description={`Overview for ${format(parseISO(today), 'EEEE, d MMMM yyyy')}`} />
      <SetupChecklist />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Active employees" value={active.length} icon={Users} />
        <StatCard
          label="Present today"
          value={presentToday}
          icon={UserCheck}
          tone="green"
          hint={active.length ? `${Math.round((presentToday / active.length) * 100)}% of workforce` : undefined}
        />
        <StatCard
          label="Absent today"
          value={absentToday}
          icon={UserX}
          tone="red"
          hint={notMarkedToday ? `${notMarkedToday} not checked in yet` : 'Everyone accounted for'}
        />
        <StatCard label="On leave today" value={leaveToday} icon={Palmtree} tone="blue" />
        <Link
          to="/admin/leave/approvals"
          className="col-span-2 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 lg:col-span-1"
        >
          <StatCard
            label="Pending requests"
            value={pending.length}
            icon={ClipboardCheck}
            tone="amber"
            hint={
              <span className="inline-flex items-center gap-1">
                Review approvals <ArrowRight className="size-3" />
              </span>
            }
          />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Attendance trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Last 7 working days</CardTitle>
            <CardDescription>Daily attendance of active employees</CardDescription>
            <CardAction className="text-right">
              <p className="text-2xl font-semibold tabular-nums">{avgRate}%</p>
              <p className="text-xs text-muted-foreground">avg. attendance</p>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2 sm:gap-4" role="list" aria-label="Attendance per day">
              {bars.map((b) => {
                const rateBase = b.present + b.absent + b.notMarked
                const rate = rateBase ? Math.round((b.present / rateBase) * 100) : 0
                const label = `${fmtDate(b.date)}: ${b.present} present, ${b.leave} on leave, ${b.absent} absent${
                  b.notMarked ? `, ${b.notMarked} not checked in` : ''
                } (${rate}% attendance)`
                return (
                  <div key={b.date} role="listitem" aria-label={label} title={label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{rate}%</span>
                    <div
                      className="flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-md bg-muted"
                      style={{ height: `${(b.total / maxTotal) * 100}%`, minHeight: 4 }}
                    >
                      {SERIES.map(({ key, status }) =>
                        b[key] ? (
                          <div
                            key={key}
                            className={cn('w-full transition-all', dayStatusMeta[status].dot)}
                            style={{ height: `${(b[key] / Math.max(1, b.total)) * 100}%` }}
                          />
                        ) : null,
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex gap-2 sm:gap-4" aria-hidden>
              {bars.map((b) => (
                <div key={b.date} className="flex-1 text-center text-[11px] leading-tight text-muted-foreground">
                  <span className={cn('block font-medium', b.date === today && 'text-foreground')}>
                    {b.date === today ? 'Today' : format(parseISO(b.date), 'EEE')}
                  </span>
                  <span className="hidden sm:block">{format(parseISO(b.date), 'd MMM')}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
              {SERIES.map(({ key, status }) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span className={cn('size-2 rounded-full', dayStatusMeta[status].dot)} />
                  {status === 'NOT_MARKED' ? 'Not checked in' : dayStatusMeta[status].label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending requests</CardTitle>
            <CardDescription>{pending.length ? `${pending.length} awaiting a decision` : 'All caught up'}</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" render={<Link to="/admin/leave/approvals" />}>
                View all <ArrowRight />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No pending requests" description="New leave applications will show up here." />
            ) : (
              <ul className="divide-y">
                {pending.slice(0, 5).map((l) => {
                  const emp = employeeById(data, l.employee)
                  return (
                    <li key={l.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <PersonAvatar name={emp?.full_name ?? '?'} photo={emp?.photo} className="size-8" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{emp?.full_name ?? 'Unknown'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {leaveTypeName(data, l.leave_type)} · {fmtDate(l.start_date)}
                          {l.end_date !== l.start_date && ` – ${fmtDate(l.end_date)}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {l.total_days} {l.total_days === 1 ? 'day' : 'days'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Absentees */}
        <Card>
          <CardHeader>
            <CardTitle>Absent / not checked in</CardTitle>
            <CardDescription>Today, {fmtDate(today)}</CardDescription>
          </CardHeader>
          <CardContent>
            {absentees.length === 0 ? (
              <EmptyState icon={UserCheck} title="Everyone is in" description="No absentees today." />
            ) : (
              <ul className="max-h-80 divide-y overflow-y-auto">
                {absentees.map(({ employee: e, status }) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <PersonAvatar name={e.full_name} photo={e.photo} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/employees/${e.id}`} className="block truncate text-sm font-medium hover:underline">
                        {e.full_name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{designationTitle(data, e.designation)}</p>
                    </div>
                    <DayStatusBadge status={status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Holidays */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming holidays</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" render={<Link to="/admin/holidays" />}>
                Calendar <ArrowRight />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length === 0 ? (
              <EmptyState icon={CalendarRange} title="No upcoming holidays" />
            ) : (
              <ul className="grid gap-3">
                {upcomingHolidays.map((h) => {
                  const d = parseISO(h.date)
                  return (
                    <li key={h.id} className="flex items-center gap-3">
                      <div className="grid w-11 shrink-0 place-items-center rounded-lg bg-violet-500/10 py-1 text-violet-700 dark:text-violet-400">
                        <span className="text-[10px] font-medium uppercase leading-none">{format(d, 'MMM')}</span>
                        <span className="text-base font-semibold leading-tight tabular-nums">{format(d, 'd')}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{format(d, 'EEEE')}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Headcount */}
        <Card>
          <CardHeader>
            <CardTitle>Department headcount</CardTitle>
            <CardDescription>Active employees</CardDescription>
          </CardHeader>
          <CardContent>
            {headcount.rows.length === 0 ? (
              <EmptyState icon={Users} title="No departments yet" />
            ) : (
              <ul className="grid gap-3">
                {headcount.rows.map(({ dept, count }) => (
                  <li key={dept.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate">{departmentName(data, dept.id)}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / headcount.max) * 100}%` }}
                        role="presentation"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
