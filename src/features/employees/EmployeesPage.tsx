import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Users,
} from 'lucide-react'
import { useHR } from '@/store/hr-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmployeeStatusBadge, EmptyState, NativeSelect, PageHeader, PersonAvatar } from '@/components/common'
import { departmentName, designationTitle } from '@/lib/hr'
import { fmtDate } from '@/lib/dates'
import { exportExcel, exportPdf, type ExportTable } from '@/lib/export'
import type { Employee } from '@/types'
import { EMPLOYMENT_TYPE_LABEL } from '@/lib/labels'


/** Confirm dialog for activating / deactivating an employee. Employees are never deleted. */
export function EmployeeStatusDialog({
  employee,
  onOpenChange,
}: {
  employee: Employee | null
  onOpenChange: (open: boolean) => void
}) {
  const { setEmployeeStatus } = useHR()
  // Keep the last employee while the dialog animates out.
  const [shown, setShown] = useState<Employee | null>(employee)
  if (employee && employee !== shown) setShown(employee)
  const target = employee ?? shown
  const deactivating = target?.status === 'ACTIVE'

  const confirm = () => {
    if (!target) return
    try {
      setEmployeeStatus(target.id, deactivating ? 'INACTIVE' : 'ACTIVE')
      toast.success(
        deactivating
          ? `${target.full_name} has been deactivated.`
          : `${target.full_name} is active again and can sign in.`,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <Dialog open={!!employee} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{deactivating ? 'Deactivate employee?' : 'Activate employee?'}</DialogTitle>
          <DialogDescription>
            {deactivating
              ? `${target?.full_name} will no longer be able to sign in and won't count towards attendance. Their records are kept and you can reactivate them at any time.`
              : `${target?.full_name} will be able to sign in again and will be included in attendance.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant={deactivating ? 'destructive' : 'default'} onClick={confirm}>
            {deactivating ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EmployeesPage() {
  const { data } = useHR()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('')
  const [status, setStatus] = useState('')
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.employees
      .filter((e) => !dept || e.department === Number(dept))
      .filter((e) => !status || e.status === status)
      .filter(
        (e) =>
          !q ||
          e.full_name.toLowerCase().includes(q) ||
          e.employee_id.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q),
      )
      .sort((a, b) => a.employee_id.localeCompare(b.employee_id))
  }, [data.employees, query, dept, status])

  const filtered = !!(query || dept || status)

  const table = (): ExportTable => ({
    title: 'Employee list',
    columns: ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Employment type', 'Joining date', 'Status'],
    rows: rows.map((e) => [
      e.employee_id,
      e.full_name,
      e.email,
      e.phone,
      departmentName(data, e.department),
      designationTitle(data, e.designation),
      EMPLOYMENT_TYPE_LABEL[e.employment_type],
      fmtDate(e.joining_date),
      e.status === 'ACTIVE' ? 'Active' : 'Inactive',
    ]),
  })

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage employee profiles and employment details."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" disabled={rows.length === 0} />}>
                <Download /> Export <ChevronDown className="opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => exportExcel('employees', table())}>
                  <FileSpreadsheet /> Excel (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportPdf(table())}>
                  <FileText /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button render={<Link to="/admin/employees/new" />}>
              <Plus /> Add employee
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_9rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, employee ID or email"
            className="pl-8"
            aria-label="Search employees"
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
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </NativeSelect>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {rows.length} of {data.employees.length} employees
        </span>
        {filtered && (
          <button
            type="button"
            className="font-medium text-foreground hover:underline"
            onClick={() => {
              setQuery('')
              setDept('')
              setStatus('')
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <Card className="py-0">
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered ? 'No employees match your filters' : 'No employees yet'}
            description={filtered ? 'Try a different search or clear the filters.' : 'Add your first employee to get started.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/employees/${e.id}`)}
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={e.full_name} photo={e.photo} className="size-8" />
                        <div className="min-w-0">
                          <Link
                            to={`/admin/employees/${e.id}`}
                            className="block font-medium hover:underline"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            {e.full_name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{e.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.employee_id}</TableCell>
                    <TableCell>{departmentName(data, e.department)}</TableCell>
                    <TableCell>{designationTitle(data, e.designation)}</TableCell>
                    <TableCell>{EMPLOYMENT_TYPE_LABEL[e.employment_type]}</TableCell>
                    <TableCell className="tabular-nums">{fmtDate(e.joining_date)}</TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={e.status} />
                    </TableCell>
                    <TableCell className="pr-4" onClick={(ev) => ev.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${e.full_name}`} />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/admin/employees/${e.id}`)}>
                            <Eye /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/employees/${e.id}/edit`)}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant={e.status === 'ACTIVE' ? 'destructive' : 'default'}
                            onClick={() => setStatusTarget(e)}
                          >
                            <Power /> {e.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <EmployeeStatusDialog employee={statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)} />
    </div>
  )
}
