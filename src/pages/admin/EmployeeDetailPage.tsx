import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { startOfMonth } from 'date-fns'
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarX2,
  Mail,
  Palmtree,
  Pencil,
  Phone,
  Power,
  ScrollText,
  Briefcase,
  UserX,
} from 'lucide-react'
import { useHR } from '@/store/hr-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  EmployeeStatusBadge,
  EmptyState,
  LeaveStatusBadge,
  PageHeader,
  PersonAvatar,
  StatCard,
} from '@/components/common'
import { AttendanceCalendar, useMonthAttendance } from '@/components/AttendanceCalendar'
import { departmentName, designationTitle, leaveBalances, leaveTypeName } from '@/lib/hr'
import { fmtDate } from '@/lib/dates'
import type { Employee } from '@/types'
import { EmployeeStatusDialog } from './EmployeesPage'
import { EMPLOYMENT_TYPE_LABEL, GENDER_LABEL } from '@/lib/labels'

function Detail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : undefined}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm break-words">{children || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
      </CardContent>
    </Card>
  )
}

function ProfileTab({ employee: e }: { employee: Employee }) {
  const { data } = useHR()
  return (
    <div className="grid gap-4">
      <Section title="Basic information">
        <Detail label="Full name">{e.full_name}</Detail>
        <Detail label="Employee ID">
          <span className="font-mono">{e.employee_id}</span>
        </Detail>
        <Detail label="Gender">{GENDER_LABEL[e.gender]}</Detail>
        <Detail label="Date of birth">{fmtDate(e.date_of_birth)}</Detail>
        <Detail label="National ID">{e.nid}</Detail>
      </Section>
      <Section title="Job details">
        <Detail label="Department">{departmentName(data, e.department)}</Detail>
        <Detail label="Designation">{designationTitle(data, e.designation)}</Detail>
        <Detail label="Employment type">{EMPLOYMENT_TYPE_LABEL[e.employment_type]}</Detail>
        <Detail label="Joining date">{fmtDate(e.joining_date)}</Detail>
        <Detail label="Status">
          <EmployeeStatusBadge status={e.status} />
        </Detail>
      </Section>
      <Section title="Contact">
        <Detail label="Email">
          <a href={`mailto:${e.email}`} className="hover:underline">
            {e.email}
          </a>
        </Detail>
        <Detail label="Phone">{e.phone}</Detail>
        <Detail label="Emergency contact">
          {e.emergency_contact.name || e.emergency_contact.phone
            ? [e.emergency_contact.name, e.emergency_contact.phone].filter(Boolean).join(' · ')
            : ''}
        </Detail>
        <Detail label="Present address" wide>
          {e.address}
        </Detail>
      </Section>
    </div>
  )
}

function AttendanceTab({ employee }: { employee: Employee }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const { summary } = useMonthAttendance(employee, month)
  const rate = summary.present + summary.absent ? Math.round((summary.present / (summary.present + summary.absent)) * 100) : 0
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Working days" value={summary.workingDays} icon={Briefcase} />
        <StatCard label="Present" value={summary.present} icon={CalendarCheck2} tone="green" hint={`${rate}% attendance`} />
        <StatCard label="Absent" value={summary.absent} icon={CalendarX2} tone="red" />
        <StatCard label="On leave" value={summary.leave} icon={Palmtree} tone="blue" />
      </div>
      <Card>
        <CardContent>
          <AttendanceCalendar employee={employee} month={month} onMonthChange={setMonth} />
        </CardContent>
      </Card>
    </div>
  )
}

function LeaveTab({ employee }: { employee: Employee }) {
  const { data } = useHR()
  const year = new Date().getFullYear()
  const balances = useMemo(() => leaveBalances(data, employee, year), [data, employee, year])
  const requests = useMemo(
    () =>
      data.leaveRequests
        .filter((l) => l.employee === employee.id)
        .sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [data.leaveRequests, employee.id],
  )
  return (
    <div className="grid gap-4">
      {balances.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {balances.map((b) => {
            const pct = b.allocated ? Math.min(100, (b.used / b.allocated) * 100) : 0
            return (
              <Card key={b.leave_type.id} size="sm">
                <CardContent>
                  <p className="text-xs font-medium text-muted-foreground">{b.leave_type.name}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {b.remaining}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ {b.allocated} days left</span>
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {b.used} used{b.pending ? ` · ${b.pending} pending` : ''} · {year}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Leave requests</CardTitle>
          <CardDescription>All applications by this employee</CardDescription>
        </CardHeader>
        {requests.length === 0 ? (
          <EmptyState icon={ScrollText} title="No leave requests" description="This employee hasn't applied for leave yet." />
        ) : (
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4">Decided by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-4 font-medium">{leaveTypeName(data, l.leave_type)}</TableCell>
                    <TableCell className="tabular-nums">
                      {fmtDate(l.start_date)}
                      {l.end_date !== l.start_date && ` – ${fmtDate(l.end_date)}`}
                      {l.is_half_day && <span className="ml-1 text-xs text-muted-foreground">(half day)</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{l.total_days}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground" title={l.reason}>
                      {l.reason}
                    </TableCell>
                    <TableCell>
                      <LeaveStatusBadge status={l.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground">{l.approved_by ?? '—'}</TableCell>
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

export function EmployeeDetailPage() {
  const { id } = useParams()
  const { data } = useHR()
  const employee = data.employees.find((e) => e.id === Number(id))
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null)

  if (!employee) {
    return (
      <div>
        <PageHeader title="Employee" />
        <Card>
          <EmptyState icon={UserX} title="Employee not found" description="This employee does not exist or the link is out of date." />
          <div className="flex justify-center pb-4">
            <Button variant="outline" render={<Link to="/admin/employees" />}>
              <ArrowLeft /> Back to employees
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const active = employee.status === 'ACTIVE'

  return (
    <div>
      <PageHeader
        title="Employee profile"
        actions={
          <Button variant="ghost" render={<Link to="/admin/employees" />}>
            <ArrowLeft /> All employees
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <PersonAvatar name={employee.full_name} photo={employee.photo} className="size-20 text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-semibold tracking-tight">{employee.full_name}</h2>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {designationTitle(data, employee.designation)} · {departmentName(data, employee.department)}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono">{employee.employee_id}</span>
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" /> {employee.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" /> {employee.phone}
              </span>
            </div>
          </div>
          <div className="flex gap-2 sm:self-start">
            <Button variant="outline" render={<Link to={`/admin/employees/${employee.id}/edit`} />}>
              <Pencil /> Edit
            </Button>
            <Button variant={active ? 'destructive' : 'default'} onClick={() => setStatusTarget(employee)}>
              <Power /> {active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="px-3">
            Profile
          </TabsTrigger>
          <TabsTrigger value="attendance" className="px-3">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave" className="px-3">
            Leave
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab employee={employee} />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab employee={employee} />
        </TabsContent>
        <TabsContent value="leave">
          <LeaveTab employee={employee} />
        </TabsContent>
      </Tabs>

      <EmployeeStatusDialog employee={statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)} />
    </div>
  )
}
