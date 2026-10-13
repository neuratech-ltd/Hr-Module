import { useState } from 'react'
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { Briefcase, CalendarX2, CircleCheck, CircleX, Palmtree } from 'lucide-react'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { AttendanceCalendar, useMonthAttendance } from './AttendanceCalendar'
import { DayStatusBadge, EmptyState, PageHeader, StatCard, ToneBadge } from '@/components/common'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fmtTime, toISO } from '@/lib/dates'
import type { Employee } from '@/types'
import { isLate, workedDuration } from '@/lib/format'

export function MyAttendancePage() {
  const { employee } = useAuth()
  if (!employee) return null
  return <MyAttendance employee={employee} />
}

function MyAttendance({ employee }: { employee: Employee }) {
  const { data } = useHR()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const { summary } = useMonthAttendance(employee, month)

  const from = toISO(startOfMonth(month))
  const to = toISO(endOfMonth(month))
  const records = data.attendance
    .filter((a) => a.employee === employee.id && a.date >= from && a.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageHeader title="My attendance" description="Your daily check-ins and monthly summary." />

      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Present" value={summary.present} icon={CircleCheck} tone="green" hint="days" />
          <StatCard label="Absent" value={summary.absent} icon={CircleX} tone="red" hint="days" />
          <StatCard label="On leave" value={summary.leave} icon={Palmtree} tone="blue" hint="days" />
          <StatCard label="Working days" value={summary.workingDays} icon={Briefcase} hint="excl. weekends & holidays" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <Card className="self-start">
            <CardContent>
              <AttendanceCalendar employee={employee} month={month} onMonthChange={(m) => setMonth(startOfMonth(m))} />
            </CardContent>
          </Card>

          <Card className="self-start">
            <CardHeader>
              <CardTitle>Daily log</CardTitle>
              <CardDescription>{format(month, 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {records.length === 0 ? (
                <EmptyState icon={CalendarX2} title="No records this month" description="Check-ins and HR entries will appear here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check in</TableHead>
                      <TableHead>Check out</TableHead>
                      <TableHead>Worked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium">{format(parseISO(r.date), 'dd MMM')}</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">{format(parseISO(r.date), 'EEE')}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {fmtTime(r.check_in)}
                          {isLate(r.check_in, data.settings.office_start_time) && (
                            <span className="ml-1.5">
                              <ToneBadge tone="amber">Late</ToneBadge>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">{fmtTime(r.check_out)}</TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                          {r.check_in && r.check_out ? workedDuration(r.check_in, r.check_out) : '—'}
                        </TableCell>
                        <TableCell>
                          <DayStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-muted-foreground" title={r.remarks}>
                          {r.remarks || (r.marked_by && r.marked_by !== 'Self' ? `Marked by ${r.marked_by}` : '—')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
