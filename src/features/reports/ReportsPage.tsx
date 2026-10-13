import { useMemo, useState } from 'react'
import { endOfMonth, format, parseISO } from 'date-fns'
import {
  BarChart3,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Percent,
  UserCheck,
  Users,
} from 'lucide-react'
import { useHR } from '@/store/hr-store'
import { cn } from '@/lib/utils'
import { dayStatus, departmentName, designationTitle, leaveBalances } from '@/lib/hr'
import { eachDay, fmtDate, todayISO, toISO } from '@/lib/dates'
import { exportExcel, exportPdf, type ExportTable } from '@/lib/export'
import type { EmploymentType } from '@/types'
import { EmployeeStatusBadge, EmptyState, NativeSelect, PageHeader, StatCard } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10)
const EMPLOYMENT: Record<EmploymentType, string> = { PERMANENT: 'Permanent', CONTRACT: 'Contract', INTERN: 'Intern' }

export function ReportsPage() {
  const [tab, setTab] = useState('attendance')
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Attendance, leave and employee reports with Excel and PDF export." />
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="mb-2">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">
          <AttendanceReport />
        </TabsContent>
        <TabsContent value="leave">
          <LeaveReport />
        </TabsContent>
        <TabsContent value="employees">
          <EmployeeReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---- Shared bits ----------------------------------------------------------

function ExportButtons({ filename, table, empty }: { filename: string; table: () => ExportTable; empty: boolean }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" disabled={empty} onClick={() => exportExcel(filename, table())}>
        <FileSpreadsheet /> Excel
      </Button>
      <Button variant="outline" disabled={empty} onClick={() => exportPdf(table())}>
        <FileText /> PDF
      </Button>
    </div>
  )
}

function Toolbar({ children, actions }: { children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {actions}
    </div>
  )
}

function DepartmentFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useHR()
  return (
    <NativeSelect value={value} onChange={(e) => onChange(e.target.value)} className="w-48" aria-label="Department">
      <option value="">All departments</option>
      {data.departments.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </NativeSelect>
  )
}

function YearPicker({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" onClick={() => onChange(year - 1)} aria-label="Previous year">
        <ChevronLeft />
      </Button>
      <span className="w-14 text-center text-sm font-medium tabular-nums">{year}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(year + 1)}
        disabled={year >= new Date().getFullYear() + 1}
        aria-label="Next year"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn('h-full rounded-full', className)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

const rateColor = (rate: number) => (rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-500' : 'bg-rose-500')

// ---- Attendance -------------------------------------------------------------

function AttendanceReport() {
  const { data } = useHR()
  const today = todayISO()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [dept, setDept] = useState('')

  const monthStart = `${month}-01`
  const monthEnd = toISO(endOfMonth(parseISO(monthStart)))
  const lastDay = monthEnd < today ? monthEnd : today
  const started = monthStart <= today
  const monthLabel = format(parseISO(monthStart), 'MMMM yyyy')

  const rows = useMemo(() => {
    if (!month || !started) return []
    const days = eachDay(monthStart, lastDay)
    return data.employees
      .filter((e) => e.status === 'ACTIVE' && e.joining_date <= lastDay && (!dept || e.department === Number(dept)))
      .sort((a, b) => a.employee_id.localeCompare(b.employee_id))
      .map((e) => {
        let present = 0
        let absent = 0
        let leave = 0
        let notMarked = 0
        for (const d of days) {
          if (d < e.joining_date) continue
          const s = dayStatus(data, e, d)
          if (s === 'PRESENT') present++
          else if (s === 'ABSENT') absent++
          else if (s === 'LEAVE') leave++
          else if (s === 'NOT_MARKED') notMarked++
        }
        const working = present + absent + leave + notMarked
        return { e, working, present, absent, leave, rate: pct(present, working) }
      })
  }, [data, month, started, monthStart, lastDay, dept])

  const totals = rows.reduce(
    (t, r) => ({ working: t.working + r.working, present: t.present + r.present, absent: t.absent + r.absent }),
    { working: 0, present: 0, absent: 0 },
  )
  const overall = pct(totals.present, totals.working)
  const absenteeism = pct(totals.absent, totals.working)

  const table = (): ExportTable => ({
    title: `Attendance report — ${monthLabel}`,
    columns: ['Employee ID', 'Name', 'Department', 'Working days', 'Present', 'Absent', 'Leave', 'Attendance rate %'],
    rows: rows.map((r) => [
      r.e.employee_id,
      r.e.full_name,
      departmentName(data, r.e.department),
      r.working,
      r.present,
      r.absent,
      r.leave,
      r.rate,
    ]),
  })

  return (
    <div className="grid gap-4">
      <Toolbar actions={<ExportButtons filename={`attendance-${month}`} table={table} empty={rows.length === 0} />}>
        <Input
          type="month"
          value={month}
          max={today.slice(0, 7)}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="w-44"
          aria-label="Month"
        />
        <DepartmentFilter value={dept} onChange={setDept} />
      </Toolbar>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Employees" value={rows.length} icon={Users} />
        <StatCard label="Attendance rate" value={`${overall}%`} icon={Percent} tone="green" hint={monthLabel} />
        <StatCard label="Absenteeism rate" value={`${absenteeism}%`} icon={CalendarX2} tone="red" hint={`${totals.absent} absent days`} />
        <StatCard label="Present days" value={totals.present} icon={UserCheck} tone="blue" hint={`of ${totals.working} working days`} />
      </div>

      <Card className="gap-0 py-0">
        {rows.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={started ? 'No employees to report on' : 'This month has not started yet'}
            description={started ? 'Try another department or month.' : 'Pick the current or an earlier month.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="text-right">Working</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Leave</TableHead>
                  <TableHead className="w-44 pr-4">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.e.id}>
                    <TableCell className="pl-4 text-muted-foreground tabular-nums">{r.e.employee_id}</TableCell>
                    <TableCell className="font-medium">{r.e.full_name}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {departmentName(data, r.e.department)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.working}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.present}</TableCell>
                    <TableCell className={cn('text-right tabular-nums', r.absent > 0 && 'text-rose-700 dark:text-rose-400')}>
                      {r.absent}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.leave}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center gap-2">
                        <Bar value={r.rate} className={rateColor(r.rate)} />
                        <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums">{r.rate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">
        Working days count present, absent and leave days up to today. Weekly off days and holidays are excluded.
      </p>
    </div>
  )
}

// ---- Leave ------------------------------------------------------------------

function LeaveReport() {
  const { data } = useHR()
  const [year, setYear] = useState(new Date().getFullYear())
  const [dept, setDept] = useState('')
  const types = data.leaveTypes

  const rows = useMemo(
    () =>
      data.employees
        .filter((e) => e.status === 'ACTIVE' && e.joining_date <= `${year}-12-31` && (!dept || e.department === Number(dept)))
        .sort((a, b) => a.employee_id.localeCompare(b.employee_id))
        .map((e) => ({ e, balances: leaveBalances(data, e, year) })),
    [data, year, dept],
  )

  const summary = types.map((t) => {
    let allocated = 0
    let used = 0
    for (const r of rows) {
      const b = r.balances.find((x) => x.leave_type.id === t.id)
      if (b) {
        allocated += b.allocated
        used += b.used
      }
    }
    return { t, allocated, used }
  })

  const table = (): ExportTable => ({
    title: `Leave report — ${year}`,
    columns: [
      'Employee ID',
      'Name',
      'Department',
      ...types.flatMap((t) => [`${t.name} allocated`, `${t.name} used`, `${t.name} remaining`]),
    ],
    rows: rows.map((r) => [
      r.e.employee_id,
      r.e.full_name,
      departmentName(data, r.e.department),
      ...types.flatMap((t) => {
        const b = r.balances.find((x) => x.leave_type.id === t.id)
        return [b?.allocated ?? 0, b?.used ?? 0, b?.remaining ?? 0]
      }),
    ]),
  })

  return (
    <div className="grid gap-4">
      <Toolbar actions={<ExportButtons filename={`leave-${year}`} table={table} empty={rows.length === 0} />}>
        <YearPicker year={year} onChange={setYear} />
        <DepartmentFilter value={dept} onChange={setDept} />
      </Toolbar>

      <Card>
        <CardHeader>
          <CardTitle>Leave usage by type</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map(({ t, allocated, used }) => {
            const p = pct(used, allocated)
            return (
              <div key={t.id} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {used} / {allocated} days · {p}%
                  </span>
                </div>
                <Bar value={p} className="bg-sky-500" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        {rows.length === 0 ? (
          <EmptyState icon={BarChart3} title="No employees to report on" description="Try another year or department." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="pl-4">
                    Employee
                  </TableHead>
                  {types.map((t) => (
                    <TableHead key={t.id} colSpan={3} className="border-l text-center">
                      {t.name}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow>
                  {types.map((t) => (
                    <SubHeads key={t.id} />
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.e.id}>
                    <TableCell className="pl-4">
                      <p className="font-medium">{r.e.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.e.employee_id} · {departmentName(data, r.e.department)}
                      </p>
                    </TableCell>
                    {types.map((t) => {
                      const b = r.balances.find((x) => x.leave_type.id === t.id)
                      return (
                        <BalanceCells key={t.id} allocated={b?.allocated ?? 0} used={b?.used ?? 0} remaining={b?.remaining ?? 0} />
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

function SubHeads() {
  return (
    <>
      <TableHead className="border-l text-right text-xs font-normal text-muted-foreground">Alloc.</TableHead>
      <TableHead className="text-right text-xs font-normal text-muted-foreground">Used</TableHead>
      <TableHead className="text-right text-xs font-normal text-muted-foreground">Left</TableHead>
    </>
  )
}

function BalanceCells({ allocated, used, remaining }: { allocated: number; used: number; remaining: number }) {
  return (
    <>
      <TableCell className="border-l text-right text-muted-foreground tabular-nums">{allocated}</TableCell>
      <TableCell className="text-right tabular-nums">{used}</TableCell>
      <TableCell className={cn('text-right font-medium tabular-nums', remaining <= 0 && allocated > 0 && 'text-rose-700 dark:text-rose-400')}>
        {remaining}
      </TableCell>
    </>
  )
}

// ---- Employees --------------------------------------------------------------

function EmployeeReport() {
  const { data } = useHR()
  const [status, setStatus] = useState('')
  const [dept, setDept] = useState('')

  const rows = useMemo(
    () =>
      data.employees
        .filter((e) => (!status || e.status === status) && (!dept || e.department === Number(dept)))
        .sort((a, b) => a.employee_id.localeCompare(b.employee_id)),
    [data.employees, status, dept],
  )

  const table = (): ExportTable => ({
    title: 'Employee list',
    columns: ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Type', 'Joining date', 'Status'],
    rows: rows.map((e) => [
      e.employee_id,
      e.full_name,
      e.email,
      e.phone,
      departmentName(data, e.department),
      designationTitle(data, e.designation),
      EMPLOYMENT[e.employment_type],
      fmtDate(e.joining_date),
      e.status === 'ACTIVE' ? 'Active' : 'Inactive',
    ]),
  })

  return (
    <div className="grid gap-4">
      <Toolbar actions={<ExportButtons filename="employees" table={table} empty={rows.length === 0} />}>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} className="w-36" aria-label="Status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </NativeSelect>
        <DepartmentFilter value={dept} onChange={setDept} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {rows.length} employee{rows.length === 1 ? '' : 's'}
        </span>
      </Toolbar>

      <Card className="gap-0 py-0">
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No employees match" description="Try another status or department." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4 text-muted-foreground tabular-nums">{e.employee_id}</TableCell>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.email}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{e.phone}</TableCell>
                    <TableCell>{departmentName(data, e.department)}</TableCell>
                    <TableCell>{designationTitle(data, e.designation)}</TableCell>
                    <TableCell>{EMPLOYMENT[e.employment_type]}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(e.joining_date)}</TableCell>
                    <TableCell className="pr-4">
                      <EmployeeStatusBadge status={e.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
