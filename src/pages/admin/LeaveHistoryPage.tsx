import { useMemo, useState } from 'react'
import { FileSpreadsheet, FileText, History, Paperclip, Search, X } from 'lucide-react'
import { useHR } from '@/store/hr-store'
import { departmentName, designationTitle, employeeById, leaveTypeName } from '@/lib/hr'
import { fmtDate, fmtDateTime } from '@/lib/dates'
import { exportExcel, exportPdf, type ExportTable } from '@/lib/export'
import type { Employee, LeaveRequest, LeaveStatus } from '@/types'
import { EmptyState, LeaveStatusBadge, NativeSelect, PageHeader, PersonAvatar } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
const statusLabel = (s: LeaveStatus) => s[0] + s.slice(1).toLowerCase()
const daysLabel = (n: number) => (n === 0.5 ? '½' : String(n))
const dateRange = (l: LeaveRequest) =>
  l.start_date === l.end_date ? fmtDate(l.start_date) : `${fmtDate(l.start_date)} – ${fmtDate(l.end_date)}`

interface Row {
  request: LeaveRequest
  employee: Employee
}

export function LeaveHistoryPage() {
  const { data } = useHR()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [dept, setDept] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [open, setOpen] = useState<Row | null>(null)

  const filtersActive = !!(search || type || status || dept || from || to)
  const clear = () => {
    setSearch('')
    setType('')
    setStatus('')
    setDept('')
    setFrom('')
    setTo('')
  }

  const rows: Row[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.leaveRequests
      .map((request) => ({ request, employee: employeeById(data, request.employee)! }))
      .filter(({ request: l, employee: e }) => {
        if (!e) return false
        if (q && !e.full_name.toLowerCase().includes(q) && !e.employee_id.toLowerCase().includes(q)) return false
        if (type && l.leave_type !== Number(type)) return false
        if (status && l.status !== status) return false
        if (dept && e.department !== Number(dept)) return false
        if (from && l.end_date < from) return false
        if (to && l.start_date > to) return false
        return true
      })
      .sort((a, b) => b.request.created_at.localeCompare(a.request.created_at))
  }, [data, search, type, status, dept, from, to])

  const table = (): ExportTable => ({
    title: 'Leave history',
    columns: ['Employee ID', 'Employee', 'Department', 'Leave type', 'From', 'To', 'Days', 'Status', 'Decided by', 'Comment', 'Applied on'],
    rows: rows.map(({ request: l, employee: e }) => [
      e.employee_id,
      e.full_name,
      departmentName(data, e.department),
      leaveTypeName(data, l.leave_type),
      fmtDate(l.start_date),
      fmtDate(l.end_date),
      l.total_days,
      statusLabel(l.status),
      l.approved_by ?? '',
      l.comment,
      fmtDate(l.created_at),
    ]),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave history"
        description="Every leave request across the company."
        actions={
          <>
            <Button variant="outline" disabled={rows.length === 0} onClick={() => exportExcel('leave-history', table())}>
              <FileSpreadsheet /> Excel
            </Button>
            <Button variant="outline" disabled={rows.length === 0} onClick={() => exportPdf(table())}>
              <FileText /> PDF
            </Button>
          </>
        }
      />

      <Card className="gap-0 py-0">
        <div className="grid gap-2 border-b p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employee name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <NativeSelect value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {data.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect value={type} onChange={(e) => setType(e.target.value)} aria-label="Leave type">
            <option value="">All leave types</option>
            {data.leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </NativeSelect>
          <div className="flex items-center gap-2">
            <Label htmlFor="lh-from" className="w-10 shrink-0 text-xs text-muted-foreground">
              From
            </Label>
            <Input id="lh-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="lh-to" className="w-10 shrink-0 text-xs text-muted-foreground">
              To
            </Label>
            <Input id="lh-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {rows.length} request{rows.length === 1 ? '' : 's'}
            </span>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={clear}>
                <X /> Clear filters
              </Button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={History}
            title={filtersActive ? 'No matching requests' : 'No leave requests yet'}
            description={filtersActive ? 'Try widening the date range or clearing filters.' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-3">Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Decided by</TableHead>
                  <TableHead className="hidden xl:table-cell">Comment</TableHead>
                  <TableHead className="hidden pr-3 lg:table-cell">Applied on</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const { request: l, employee: e } = row
                  return (
                    <TableRow
                      key={l.id}
                      className="cursor-pointer"
                      tabIndex={0}
                      onClick={() => setOpen(row)}
                      onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), setOpen(row))}
                    >
                      <TableCell className="pl-3">
                        <div className="flex items-center gap-2.5">
                          <PersonAvatar name={e.full_name} photo={e.photo} className="size-8" />
                          <div className="leading-tight">
                            <p className="font-medium">{e.full_name}</p>
                            <p className="text-xs text-muted-foreground">{e.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{leaveTypeName(data, l.leave_type)}</TableCell>
                      <TableCell className="whitespace-nowrap">{dateRange(l)}</TableCell>
                      <TableCell className="text-right tabular-nums">{daysLabel(l.total_days)}</TableCell>
                      <TableCell>
                        <LeaveStatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{l.approved_by ?? '—'}</TableCell>
                      <TableCell className="hidden max-w-56 truncate text-muted-foreground xl:table-cell">
                        {l.comment || '—'}
                      </TableCell>
                      <TableCell className="hidden pr-3 text-muted-foreground lg:table-cell">
                        {fmtDate(l.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {open && <Details row={open} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Details({ row }: { row: Row }) {
  const { data } = useHR()
  const { request: l, employee: e } = row
  const items: [string, React.ReactNode][] = [
    ['Leave type', leaveTypeName(data, l.leave_type)],
    ['Dates', dateRange(l)],
    ['Days', l.is_half_day ? '½ day (half day)' : `${l.total_days} working day${l.total_days === 1 ? '' : 's'}`],
    ['Status', <LeaveStatusBadge key="s" status={l.status} />],
    ['Applied on', fmtDateTime(l.created_at)],
    ['Decided by', l.approved_by ?? '—'],
  ]
  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>Leave request</SheetTitle>
        <SheetDescription>Request #{l.id}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-6 px-4 pb-6">
        <div className="flex items-center gap-3">
          <PersonAvatar name={e.full_name} photo={e.photo} className="size-11" />
          <div className="leading-tight">
            <p className="font-medium">{e.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {e.employee_id} · {designationTitle(data, e.designation)}
            </p>
            <p className="text-xs text-muted-foreground">{departmentName(data, e.department)}</p>
          </div>
        </div>

        <dl className="grid gap-3">
          {items.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Reason</p>
          <p className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{l.reason || '—'}</p>
        </div>

        {l.comment && (
          <div className="grid gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">HR comment</p>
            <p className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{l.comment}</p>
          </div>
        )}

        {l.attachment && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground">
            <Paperclip className="size-3.5" /> {l.attachment}
          </span>
        )}
      </div>
    </>
  )
}
