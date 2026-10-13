import { useMemo, useState } from 'react'
import { parseISO } from 'date-fns'
import { AlertTriangle, CalendarDays, Check, CheckCircle2, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { useHR } from '@/store/hr-store'
import { useAuth } from '@/auth/auth'
import { departmentName, employeeById, leaveBalances, leaveTypeName } from '@/lib/hr'
import { fmtDate } from '@/lib/dates'
import type { Employee, LeaveRequest } from '@/types'
import { EmptyState, Field, NativeSelect, PageHeader, PersonAvatar, ToneBadge } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Decision = 'APPROVED' | 'REJECTED'

const daysLabel = (n: number) => (n === 0.5 ? '½ day' : `${n} day${n === 1 ? '' : 's'}`)

const dateRange = (l: LeaveRequest) =>
  l.start_date === l.end_date ? fmtDate(l.start_date) : `${fmtDate(l.start_date)} – ${fmtDate(l.end_date)}`

export function LeaveApprovalsPage() {
  const { data, decideLeave } = useHR()
  const { user } = useAuth()
  const [typeFilter, setTypeFilter] = useState('')
  const [deciding, setDeciding] = useState<{ request: LeaveRequest; decision: Decision } | null>(null)

  const pending = useMemo(
    () =>
      data.leaveRequests
        .filter((l) => l.status === 'PENDING')
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [data.leaveRequests],
  )
  const shown = pending.filter((l) => !typeFilter || l.leave_type === Number(typeFilter))

  const decide = (comment: string) => {
    if (!deciding || !user) return false
    const { request, decision } = deciding
    const employee = employeeById(data, request.employee)
    try {
      decideLeave(request.id, decision, comment, user.name)
      toast.success(
        `${decision === 'APPROVED' ? 'Approved' : 'Rejected'} — email notification sent to ${employee?.email ?? 'the employee'}`,
      )
      return true
    } catch (err) {
      toast.error((err as Error).message)
      return false
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave approvals"
        description={
          pending.length === 0
            ? 'No requests are waiting for a decision.'
            : `${pending.length} request${pending.length === 1 ? '' : 's'} waiting for a decision, oldest first.`
        }
        actions={
          pending.length > 0 && (
            <NativeSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-44"
              aria-label="Leave type"
            >
              <option value="">All leave types</option>
              {data.leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          )
        }
      />

      {shown.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckCircle2}
            title={pending.length === 0 ? 'All caught up' : 'Nothing pending for this leave type'}
            description={
              pending.length === 0
                ? 'New leave requests will appear here as soon as employees apply.'
                : 'Choose another leave type to see the remaining requests.'
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {shown.map((request) => {
            const employee = employeeById(data, request.employee)
            if (!employee) return null
            return (
              <RequestCard
                key={request.id}
                request={request}
                employee={employee}
                onDecide={(decision) => setDeciding({ request, decision })}
              />
            )
          })}
        </div>
      )}

      <DecisionDialog
        state={deciding}
        employeeName={deciding ? (employeeById(data, deciding.request.employee)?.full_name ?? '') : ''}
        onClose={() => setDeciding(null)}
        onConfirm={decide}
      />
    </div>
  )
}

function RequestCard({
  request,
  employee,
  onDecide,
}: {
  request: LeaveRequest
  employee: Employee
  onDecide: (d: Decision) => void
}) {
  const { data } = useHR()
  const balance = leaveBalances(data, employee, parseISO(request.start_date).getFullYear()).find(
    (b) => b.leave_type.id === request.leave_type,
  )
  const short = balance ? request.total_days > balance.remaining : false

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <PersonAvatar name={employee.full_name} photo={employee.photo} className="size-10" />
            <div className="min-w-0 leading-tight">
              <p className="font-medium">{employee.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {employee.employee_id} · {departmentName(data, employee.department)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ToneBadge tone="violet">{leaveTypeName(data, request.leave_type)}</ToneBadge>
            <span className="text-xs text-muted-foreground">Applied {fmtDate(request.created_at)}</span>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg bg-muted/50 p-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Dates</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
              <CalendarDays className="size-3.5 text-muted-foreground" />
              {dateRange(request)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="mt-0.5 text-sm font-medium">
              {daysLabel(request.total_days)}
              {request.is_half_day && <span className="font-normal text-muted-foreground"> (half day)</span>}
            </p>
          </div>
          {balance && (
            <div>
              <p className="text-xs text-muted-foreground">Balance remaining</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">
                {balance.remaining} <span className="font-normal text-muted-foreground">of {balance.allocated} days</span>
              </p>
            </div>
          )}
        </div>

        {request.reason && <p className="text-sm leading-relaxed">{request.reason}</p>}

        {short && balance && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              This request ({daysLabel(request.total_days)}) is more than the {balance.remaining} day
              {balance.remaining === 1 ? '' : 's'} left in {balance.leave_type.name}.
            </span>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {request.attachment && (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                <Paperclip className="size-3.5 shrink-0" />
                <span className="truncate">{request.attachment}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onDecide('REJECTED')}>
              <X /> Reject
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={() => onDecide('APPROVED')}>
              <Check /> Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DecisionDialog({
  state,
  employeeName,
  onClose,
  onConfirm,
}: {
  state: { request: LeaveRequest; decision: Decision } | null
  employeeName: string
  onClose: () => void
  onConfirm: (comment: string) => boolean
}) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [last, setLast] = useState(state)
  if (state !== last) {
    setLast(state)
    setComment('')
    setError('')
  }

  const reject = state?.decision === 'REJECTED'

  const submit = () => {
    if (reject && !comment.trim()) {
      setError('Add a short reason so the employee knows why.')
      return
    }
    if (onConfirm(comment.trim())) onClose()
  }

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{reject ? 'Reject leave request' : 'Approve leave request'}</DialogTitle>
          <DialogDescription>
            {employeeName}
            {state && ` · ${dateRange(state.request)} · ${daysLabel(state.request.total_days)}`}
          </DialogDescription>
        </DialogHeader>
        <Field
          label={reject ? 'Reason for rejection' : 'Comment (optional)'}
          htmlFor="decision-comment"
          required={reject}
          error={error}
          hint="The employee will see this comment and receive an email."
        >
          <Textarea
            id="decision-comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              if (error) setError('')
            }}
            placeholder={reject ? 'e.g. Release week — please pick other dates.' : 'e.g. Enjoy your time off.'}
            aria-invalid={!!error}
            rows={3}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={reject ? 'destructive' : 'default'} onClick={submit}>
            {reject ? 'Reject request' : 'Approve request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
