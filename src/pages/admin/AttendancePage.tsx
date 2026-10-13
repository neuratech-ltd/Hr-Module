import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import {
  CalendarOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Palmtree,
  PencilLine,
  Search,
  Settings2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useHR } from '@/store/hr-store'
import { useAuth } from '@/auth/auth'
import { cn } from '@/lib/utils'
import { dayStatus, departmentName, holidayOn, isWeeklyOff, recordOn } from '@/lib/hr'
import { fmtTime, todayISO, toISO } from '@/lib/dates'
import type { AttendanceRecord, AttendanceStatus, DayStatus, Employee } from '@/types'
import {
  DayStatusBadge,
  EmptyState,
  Field,
  NativeSelect,
  PageHeader,
  PersonAvatar,
  StatCard,
  dayStatusMeta,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Row {
  employee: Employee
  status: DayStatus
  record: AttendanceRecord | null
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LEAVE', label: 'On leave' },
  { value: 'NOT_MARKED', label: 'Not marked' },
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'WEEKEND', label: 'Weekend' },
]

export function AttendancePage() {
  const { data, markAttendance, correctAttendance } = useHR()
  const { user } = useAuth()
  const today = todayISO()

  const [date, setDate] = useState(today)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [correcting, setCorrecting] = useState<Row | null>(null)

  const holiday = holidayOn(data, date)
  const weekend = isWeeklyOff(data, date)

  const rows: Row[] = useMemo(
    () =>
      data.employees
        .filter((e) => e.status === 'ACTIVE' && e.joining_date <= date)
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
        .map((employee) => ({
          employee,
          status: dayStatus(data, employee, date),
          record: recordOn(data, employee.id, date),
        })),
    [data, date],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (!q || r.employee.full_name.toLowerCase().includes(q) || r.employee.employee_id.toLowerCase().includes(q)) &&
        (!dept || r.employee.department === Number(dept)) &&
        (!statusFilter || r.status === statusFilter),
    )
  }, [rows, search, dept, statusFilter])

  const count = (s: DayStatus) => rows.filter((r) => r.status === s).length
  const unmarked = rows.filter((r) => !r.record && r.status !== 'LEAVE')

  const changeDate = (next: string) => {
    if (!next) return
    setDate(next > today ? today : next)
    setSelected(new Set())
  }
  const shift = (days: number) => changeDate(toISO(addDays(parseISO(date), days)))

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.employee.id))
  const someSelected = filtered.some((r) => selected.has(r.employee.id))
  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      filtered.forEach((r) => (checked ? next.add(r.employee.id) : next.delete(r.employee.id)))
      return next
    })
  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const bulkMark = (ids: number[], status: AttendanceStatus) => {
    if (!user || ids.length === 0) return
    const skipped = ids.filter((id) => recordOn(data, id, date)).length
    const marked = ids.length - skipped
    try {
      markAttendance(date, ids, status, user.name)
      const label = status === 'PRESENT' ? 'present' : 'absent'
      if (marked > 0) toast.success(`${marked} employee${marked === 1 ? '' : 's'} marked ${label}.`)
      if (skipped > 0)
        toast.warning(
          `${skipped} skipped — they already have a record for this day. Use "Correct" to change existing records.`,
        )
      setSelected(new Set())
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const dateLabel = format(parseISO(date), 'EEEE, d MMMM yyyy')
  const selectedIds = [...selected]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily attendance"
        description="Review, mark and correct attendance for any day."
        actions={
          <Button variant="outline" render={<Link to="/admin/attendance/settings" />}>
            <Settings2 /> Office settings
          </Button>
        }
      />

      {/* Date navigation */}
      <Card size="sm" className="px-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous day">
              <ChevronLeft />
            </Button>
            <Input
              type="date"
              value={date}
              max={today}
              onChange={(e) => changeDate(e.target.value)}
              className="w-40"
              aria-label="Attendance date"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => shift(1)}
              disabled={date >= today}
              aria-label="Next day"
            >
              <ChevronRight />
            </Button>
            {date !== today && (
              <Button variant="ghost" onClick={() => changeDate(today)}>
                Today
              </Button>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground">{dateLabel}</p>
        </div>
      </Card>

      {(holiday || weekend) && (
        <Alert>
          <CalendarOff />
          <AlertTitle>{holiday ? `Public holiday — ${holiday.name}` : 'Weekly off day'}</AlertTitle>
          <AlertDescription>
            Nobody is expected at work today and no one will be marked absent. You can still record attendance for
            anyone who came in.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Employees" value={rows.length} icon={Users} />
        <StatCard label="Present" value={count('PRESENT')} icon={UserCheck} tone="green" />
        <StatCard label="Absent" value={count('ABSENT')} icon={UserX} tone="red" />
        <StatCard label="On leave" value={count('LEAVE')} icon={Palmtree} tone="blue" />
        <StatCard label="Not marked" value={count('NOT_MARKED')} icon={Clock} tone="amber" />
      </div>

      <Card className="gap-0 py-0">
        {/* Filters */}
        <div className="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <NativeSelect value={dept} onChange={(e) => setDept(e.target.value)} className="md:w-48" aria-label="Department">
              <option value="">All departments</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="md:w-40"
              aria-label="Status"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          {unmarked.length > 0 && selected.size === 0 && (
            <Button variant="outline" onClick={() => bulkMark(unmarked.map((r) => r.employee.id), 'PRESENT')}>
              <CheckCheck /> Mark {unmarked.length} unmarked present
            </Button>
          )}
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" onClick={() => bulkMark(selectedIds, 'PRESENT')}>
                <UserCheck /> Mark present
              </Button>
              <Button size="sm" variant="destructive" onClick={() => bulkMark(selectedIds, 'ABSENT')}>
                <UserX /> Mark absent
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                <X /> Clear
              </Button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={rows.length === 0 ? 'No active employees on this date' : 'No matching employees'}
            description={rows.length === 0 ? undefined : 'Try a different search or clear the filters.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-3">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onCheckedChange={(c) => toggleAll(c)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead>Check in</TableHead>
                  <TableHead>Check out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Remarks</TableHead>
                  <TableHead className="pr-3 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const e = r.employee
                  const checked = selected.has(e.id)
                  return (
                    <TableRow key={e.id} data-state={checked ? 'selected' : undefined}>
                      <TableCell className="pl-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => toggle(e.id, c)}
                          aria-label={`Select ${e.full_name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <PersonAvatar name={e.full_name} photo={e.photo} className="size-8" />
                          <div className="min-w-0 leading-tight">
                            <p className="truncate font-medium">{e.full_name}</p>
                            <p className="text-xs text-muted-foreground">{e.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {departmentName(data, e.department)}
                      </TableCell>
                      <TableCell className="tabular-nums">{fmtTime(r.record?.check_in)}</TableCell>
                      <TableCell className="tabular-nums">{fmtTime(r.record?.check_out)}</TableCell>
                      <TableCell>
                        <DayStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="hidden max-w-64 lg:table-cell">
                        <RemarksCell row={r} />
                      </TableCell>
                      <TableCell className="pr-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setCorrecting(r)}>
                          <PencilLine /> Correct
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <CorrectDialog
        row={correcting}
        date={dateLabel}
        onClose={() => setCorrecting(null)}
        onSave={(status, remark) => {
          if (!correcting || !user) return false
          try {
            correctAttendance(correcting.employee.id, date, status, remark, user.name)
            toast.success(`Attendance updated for ${correcting.employee.full_name}.`)
            return true
          } catch (err) {
            toast.error((err as Error).message)
            return false
          }
        }}
      />
    </div>
  )
}

function RemarksCell({ row }: { row: Row }) {
  if (row.record) {
    return (
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm">{row.record.remarks || <span className="text-muted-foreground">—</span>}</p>
        <p className="text-xs text-muted-foreground">by {row.record.marked_by}</p>
      </div>
    )
  }
  if (row.status === 'ABSENT') return <span className="text-sm text-muted-foreground">No check-in (auto absent)</span>
  if (row.status === 'LEAVE') return <span className="text-sm text-muted-foreground">Approved leave</span>
  return <span className="text-sm text-muted-foreground">—</span>
}

function CorrectDialog({
  row,
  date,
  onClose,
  onSave,
}: {
  row: Row | null
  date: string
  onClose: () => void
  onSave: (status: AttendanceStatus, remark: string) => boolean
}) {
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT')
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')
  const [lastRow, setLastRow] = useState<Row | null>(null)

  // Reset the form whenever a different row is opened.
  if (row !== lastRow) {
    setLastRow(row)
    if (row) {
      setStatus(row.status === 'PRESENT' ? 'ABSENT' : 'PRESENT')
      setRemark('')
      setError('')
    }
  }

  const submit = () => {
    if (!remark.trim()) {
      setError('Please explain why this record is being corrected.')
      return
    }
    if (onSave(status, remark.trim())) onClose()
  }

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Correct attendance</DialogTitle>
          <DialogDescription>
            {row?.employee.full_name} · {date}
          </DialogDescription>
        </DialogHeader>

        {row && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm text-muted-foreground">Current status</span>
              <DayStatusBadge status={row.status} />
            </div>

            <Field label="New status" required>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup">
                {(['PRESENT', 'ABSENT'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={status === s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      status === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className={cn('size-2 rounded-full', dayStatusMeta[s].dot)} />
                    {dayStatusMeta[s].label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Remark" htmlFor="correction-remark" required error={error}>
              <Textarea
                id="correction-remark"
                value={remark}
                onChange={(e) => {
                  setRemark(e.target.value)
                  if (error) setError('')
                }}
                placeholder="e.g. Forgot to check in — confirmed by team lead."
                aria-invalid={!!error}
                rows={3}
              />
            </Field>

            <p className="text-xs text-muted-foreground">
              Attendance records are never deleted. Every correction keeps a remark and the name of the person who made
              it.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save correction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
