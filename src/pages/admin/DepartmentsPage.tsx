import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Briefcase, Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useHR } from '@/store/hr-store'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, Field, NativeSelect, PageHeader } from '@/components/common'
import { departmentName } from '@/lib/hr'
import type { Department, Designation } from '@/types'

type DeptDraft = { id?: number; name: string; code: string }
type DesigDraft = { id?: number; title: string; department: string }
type DeleteTarget = { kind: 'department'; item: Department } | { kind: 'designation'; item: Designation }

function RowActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-0.5">
      <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${label}`}>
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  )
}

function DepartmentDialog({ draft, onClose }: { draft: DeptDraft | null; onClose: () => void }) {
  const { saveDepartment } = useHR()
  const [form, setForm] = useState<DeptDraft>({ name: '', code: '' })
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({})
  const [opened, setOpened] = useState<DeptDraft | null>(null)
  if (draft && draft !== opened) {
    setOpened(draft)
    setForm(draft)
    setErrors({})
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    const code = form.code.trim().toUpperCase()
    const errs: typeof errors = {}
    if (!name) errs.name = 'Department name is required.'
    if (!code) errs.code = 'Code is required.'
    else if (!/^[A-Z0-9]{2,6}$/.test(code)) errs.code = 'Use 2–6 letters or digits.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      saveDepartment({ name, code }, form.id)
      toast.success(form.id ? 'Department updated.' : `${name} department added.`)
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
      setErrors({ code: (err as Error).message })
    }
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit department' : 'Add department'}</DialogTitle>
            <DialogDescription>Departments group employees and their designations.</DialogDescription>
          </DialogHeader>
          <Field label="Name" htmlFor="dept-name" required error={errors.name}>
            <Input
              id="dept-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
              placeholder="e.g. Engineering"
              autoFocus
            />
          </Field>
          <Field label="Code" htmlFor="dept-code" required error={errors.code} hint="Short unique code, e.g. ENG">
            <Input
              id="dept-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              aria-invalid={!!errors.code}
              className="font-mono uppercase"
              maxLength={6}
            />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">{form.id ? 'Save changes' : 'Add department'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DesignationDialog({ draft, onClose }: { draft: DesigDraft | null; onClose: () => void }) {
  const { data, saveDesignation } = useHR()
  const [form, setForm] = useState<DesigDraft>({ title: '', department: '' })
  const [errors, setErrors] = useState<{ title?: string; department?: string }>({})
  const [opened, setOpened] = useState<DesigDraft | null>(null)
  if (draft && draft !== opened) {
    setOpened(draft)
    setForm(draft)
    setErrors({})
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const title = form.title.trim()
    const errs: typeof errors = {}
    if (!title) errs.title = 'Title is required.'
    if (!form.department) errs.department = 'Select a department.'
    if (
      title &&
      form.department &&
      data.designations.some(
        (d) => d.id !== form.id && d.department === Number(form.department) && d.title.toLowerCase() === title.toLowerCase(),
      )
    )
      errs.title = 'This department already has a designation with this title.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      saveDesignation({ title, department: Number(form.department) }, form.id)
      toast.success(form.id ? 'Designation updated.' : `${title} added.`)
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit designation' : 'Add designation'}</DialogTitle>
            <DialogDescription>Job titles available within a department.</DialogDescription>
          </DialogHeader>
          <Field label="Title" htmlFor="desig-title" required error={errors.title}>
            <Input
              id="desig-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              aria-invalid={!!errors.title}
              placeholder="e.g. Software Engineer"
              autoFocus
            />
          </Field>
          <Field label="Department" htmlFor="desig-dept" required error={errors.department}>
            <NativeSelect
              id="desig-dept"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              aria-invalid={!!errors.department}
            >
              <option value="" disabled>
                Select department
              </option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">{form.id ? 'Save changes' : 'Add designation'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DepartmentsPage() {
  const { data, deleteDepartment, deleteDesignation } = useHR()
  const [deptDraft, setDeptDraft] = useState<DeptDraft | null>(null)
  const [desigDraft, setDesigDraft] = useState<DesigDraft | null>(null)
  const [toDelete, setToDelete] = useState<DeleteTarget | null>(null)
  const [lastDelete, setLastDelete] = useState<DeleteTarget | null>(null)
  const [filter, setFilter] = useState('')
  if (toDelete && toDelete !== lastDelete) setLastDelete(toDelete)
  const shownDelete = toDelete ?? lastDelete

  const countBy = (key: 'department' | 'designation', id: number) =>
    data.employees.filter((e) => e[key] === id).length

  const designations = data.designations
    .filter((d) => !filter || d.department === Number(filter))
    .sort((a, b) => a.department - b.department || a.title.localeCompare(b.title))

  const confirmDelete = () => {
    if (!toDelete) return
    try {
      if (toDelete.kind === 'department') deleteDepartment(toDelete.item.id)
      else deleteDesignation(toDelete.item.id)
      toast.success(
        `${toDelete.kind === 'department' ? toDelete.item.name : toDelete.item.title} deleted.`,
      )
      if (toDelete.kind === 'department' && filter === String(toDelete.item.id)) setFilter('')
    } catch (err) {
      toast.error((err as Error).message)
    }
    setToDelete(null)
  }

  const deleteName = shownDelete ? (shownDelete.kind === 'department' ? shownDelete.item.name : shownDelete.item.title) : ''

  return (
    <div>
      <PageHeader title="Departments & designations" description="Organise your company structure and job titles." />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Departments */}
        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>{data.departments.length} departments</CardDescription>
            <CardAction>
              <Button size="sm" onClick={() => setDeptDraft({ name: '', code: '' })}>
                <Plus /> Add
              </Button>
            </CardAction>
          </CardHeader>
          {data.departments.length === 0 ? (
            <EmptyState icon={Building2} title="No departments yet" description="Add a department to start organising employees." />
          ) : (
            <div className="overflow-x-auto border-t">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="w-20 pr-4">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.departments.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="pl-4 font-medium">{d.name}</TableCell>
                      <TableCell>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{d.code}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{countBy('department', d.id)}</TableCell>
                      <TableCell className="pr-4">
                        <RowActions
                          label={d.name}
                          onEdit={() => setDeptDraft({ id: d.id, name: d.name, code: d.code })}
                          onDelete={() => setToDelete({ kind: 'department', item: d })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Designations */}
        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Designations</CardTitle>
            <CardDescription>{designations.length} shown</CardDescription>
            <CardAction>
              <Button
                size="sm"
                onClick={() => setDesigDraft({ title: '', department: filter })}
                disabled={data.departments.length === 0}
              >
                <Plus /> Add
              </Button>
            </CardAction>
          </CardHeader>
          <div className="px-4">
            <NativeSelect value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by department">
              <option value="">All departments</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          {designations.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No designations"
              description={filter ? 'This department has no designations yet.' : 'Add job titles for your departments.'}
            />
          ) : (
            <div className="overflow-x-auto border-t">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4">Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="w-20 pr-4">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="pl-4 font-medium">{d.title}</TableCell>
                      <TableCell className="text-muted-foreground">{departmentName(data, d.department)}</TableCell>
                      <TableCell className="text-right tabular-nums">{countBy('designation', d.id)}</TableCell>
                      <TableCell className="pr-4">
                        <RowActions
                          label={d.title}
                          onEdit={() => setDesigDraft({ id: d.id, title: d.title, department: String(d.department) })}
                          onDelete={() => setToDelete({ kind: 'designation', item: d })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Employee counts include inactive employees. A department or designation can only be deleted once no employee is assigned to it.
      </p>

      <DepartmentDialog draft={deptDraft} onClose={() => setDeptDraft(null)} />
      <DesignationDialog draft={desigDraft} onClose={() => setDesigDraft(null)} />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {shownDelete?.kind}?</DialogTitle>
            <DialogDescription>
              {shownDelete?.kind === 'department'
                ? `“${deleteName}” and its designations will be removed. This can't be undone.`
                : `“${deleteName}” will be removed. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
