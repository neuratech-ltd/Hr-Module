import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO, startOfMonth } from 'date-fns'
import {
  Bell,
  CalendarCheck2,
  CalendarClock,
  CalendarPlus,
  CalendarRange,
  CalendarX2,
  Hourglass,
  History,
  KeyRound,
  PartyPopper,
  UserRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { useMonthAttendance } from '@/features/attendance/AttendanceCalendar'
import { EmptyState, LeaveStatusBadge, PersonAvatar, ToneBadge } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { leaveTypeName } from '@/lib/hr'
import { todayISO } from '@/lib/dates'
import type { Employee } from '@/types'
import { fmtDays, fmtRange } from '@/lib/format'
import { useNow } from '@/hooks/useNow'
import { CheckInCard } from '@/features/attendance/CheckInCard'
import { WeeklyAttendanceChart } from './WeeklyAttendanceChart'

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
  const { data } = useHR()
  const firstName = employee.full_name.split(' ')[0]
  const pending = data.leaveRequests.filter((l) => l.employee === employee.id && l.status === 'PENDING').length

  return (
    <div className="pb-4">
      {/* Navy top bar; the content sheet below overlaps it, like a mobile app. */}
      <section className="-mx-4 -mt-6 bg-hero px-5 pt-6 pb-24 text-hero-foreground sm:-mx-6 sm:px-8 lg:-mt-8 lg:rounded-b-3xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <PersonAvatar name={employee.full_name} photo={employee.photo} className="size-12 ring-2 ring-white/30" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-xl font-semibold sm:text-2xl">Hi, {firstName}!</h1>
            <p className="text-sm text-hero-foreground/70">{greeting(now)} · Explore the dashboard</p>
          </div>
          <Link
            to="/leave"
            className="relative grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            aria-label={pending ? `${pending} pending leave request${pending === 1 ? '' : 's'}` : 'My leave'}
          >
            <Bell className="size-5" />
            {pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid size-4.5 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-hero tabular-nums">
                {pending}
              </span>
            )}
          </Link>
        </div>
      </section>

      <div className="relative mx-auto -mt-16 grid max-w-5xl gap-5">
        <CheckInCard employee={employee} />
        <SummaryTiles employee={employee} />
        <div className="grid gap-5 lg:grid-cols-2">
          <WeeklyAttendanceChart employee={employee} />
          <QuickActions />
        </div>
        <UpcomingCard employee={employee} />
      </div>
    </div>
  )
}

const tileTones = {
  red: { tile: 'bg-rose-50 dark:bg-rose-500/10', icon: 'bg-white text-rose-600 dark:bg-rose-500/20 dark:text-rose-300' },
  amber: { tile: 'bg-amber-50 dark:bg-amber-500/10', icon: 'bg-white text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' },
  violet: { tile: 'bg-violet-50 dark:bg-violet-500/10', icon: 'bg-white text-violet-600 dark:bg-violet-500/20 dark:text-violet-300' },
}

/** Pastel summary tiles: missed attendance, pending leave, upcoming holidays. */
function SummaryTiles({ employee }: { employee: Employee }) {
  const { data } = useHR()
  const [month] = useState(() => startOfMonth(new Date()))
  const { summary } = useMonthAttendance(employee, month)
  const today = todayISO()
  const pending = data.leaveRequests.filter((l) => l.employee === employee.id && l.status === 'PENDING').length
  const holidays = data.holidays.filter((h) => h.date >= today && h.date.slice(0, 4) === today.slice(0, 4)).length

  const tiles: { label: string; value: number; icon: LucideIcon; tone: keyof typeof tileTones; to: string }[] = [
    { label: 'Missed attendance', value: summary.absent, icon: CalendarX2, tone: 'red', to: '/attendance' },
    { label: 'Pending approval', value: pending, icon: Hourglass, tone: 'amber', to: '/leave' },
    { label: 'Upcoming holidays', value: holidays, icon: PartyPopper, tone: 'violet', to: '/attendance' },
  ]

  return (
    <section>
      <h2 className="mb-2.5 px-1 text-sm font-semibold">Summary · {format(month, 'MMMM')}</h2>
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className={cn('flex flex-col gap-3 rounded-2xl p-3.5 transition-transform hover:-translate-y-0.5 sm:p-4', tileTones[t.tone].tile)}
          >
            <div className="flex items-center justify-between">
              <span className={cn('grid size-9 place-items-center rounded-xl shadow-sm', tileTones[t.tone].icon)}>
                <t.icon className="size-4.5" />
              </span>
              <span className="text-2xl font-semibold tabular-nums">{String(t.value).padStart(2, '0')}</span>
            </div>
            <span className="text-xs leading-tight text-muted-foreground sm:text-sm">{t.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

const ACTIONS: { label: string; icon: LucideIcon; to: string }[] = [
  { label: 'My attendance', icon: CalendarCheck2, to: '/attendance' },
  { label: 'Apply leave', icon: CalendarPlus, to: '/leave/apply' },
  { label: 'Leave history', icon: History, to: '/leave' },
  { label: 'Leave balance', icon: WalletCards, to: '/leave' },
  { label: 'My profile', icon: UserRound, to: '/profile' },
  { label: 'Change password', icon: KeyRound, to: '/change-password' },
]

/** Round-icon shortcuts, like a mobile home screen. */
function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Attendance, leave and profile</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {ACTIONS.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="group flex flex-col items-center gap-2 rounded-2xl border bg-background px-2 py-4 text-center transition-colors hover:border-primary/40 hover:bg-accent/60"
            >
              <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <a.icon className="size-5" />
              </span>
              <span className="text-xs leading-tight font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
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
            <CalendarRange />
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
