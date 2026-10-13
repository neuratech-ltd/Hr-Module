import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Inbox, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { EmptyState, LeaveStatusBadge, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { leaveTypeName } from '@/lib/hr'
import type { Employee, LeaveStatus } from '@/types'
import { fmtDays, fmtRange } from '@/lib/format'
import { LeaveBalanceCards } from './LeaveBalanceCards'

type Filter = 'ALL' | LeaveStatus
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function MyLeavePage() {
  const { employee } = useAuth()
  if (!employee) return null
  return <MyLeave employee={employee} />
}

function MyLeave({ employee }: { employee: Employee }) {
  const { data, cancelLeave } = useHR()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [cancelId, setCancelId] = useState<number | null>(null)

  const mine = data.leaveRequests
    .filter((l) => l.employee === employee.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const rows = filter === 'ALL' ? mine : mine.filter((l) => l.status === filter)
  const count = (f: Filter) => (f === 'ALL' ? mine.length : mine.filter((l) => l.status === f).length)
  const toCancel = mine.find((l) => l.id === cancelId)

  function confirmCancel() {
    if (cancelId === null) return
    try {
      cancelLeave(cancelId)
      toast.success('Leave request cancelled.')
      setCancelId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel the request.')
    }
  }

  return (
    <>
      <PageHeader
        title="My leave"
        description="Your balances and every request you've made."
        actions={
          <Button render={<Link to="/leave/apply" />}>
            <CalendarPlus />
            Apply for leave
          </Button>
        }
      />

      <div className="grid gap-6">
        <LeaveBalanceCards employee={employee} />

        <Card>
          <CardHeader className="gap-3 sm:flex sm:items-center sm:justify-between">
            <CardTitle>Leave history</CardTitle>
            <div className="-mx-1 overflow-x-auto px-1">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                <TabsList>
                  {FILTERS.map((f) => (
                    <TabsTrigger key={f.value} value={f.value} className="px-2.5">
                      {f.label}
                      <span className="text-xs text-muted-foreground tabular-nums">{count(f.value)}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {rows.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={filter === 'ALL' ? 'No leave requests yet' : `No ${filter.toLowerCase()} requests`}
                description={filter === 'ALL' ? 'When you apply for leave, it will show up here.' : undefined}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HR comment</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium whitespace-nowrap">{leaveTypeName(data, l.leave_type)}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtRange(l.start_date, l.end_date)}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">{fmtDays(l.total_days)}</TableCell>
                      <TableCell className="max-w-56">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate" title={l.reason}>
                            {l.reason}
                          </span>
                          {l.attachment && (
                            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-label={`Attachment: ${l.attachment}`} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <LeaveStatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground" title={l.comment}>
                        {l.comment || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {l.status === 'PENDING' && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelId(l.id)}>
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={cancelId !== null} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this leave request?</DialogTitle>
            <DialogDescription>
              {toCancel ? (
                <>
                  {leaveTypeName(data, toCancel.leave_type)} · {fmtRange(toCancel.start_date, toCancel.end_date)} ·{' '}
                  {fmtDays(toCancel.total_days)}. This can't be undone, but you can apply again.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Keep request</DialogClose>
            <Button variant="destructive" onClick={confirmCancel}>
              Cancel request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
