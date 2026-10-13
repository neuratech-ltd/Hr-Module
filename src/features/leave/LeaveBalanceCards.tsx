import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import { useHR } from '@/store/hr-store'
import { EmptyState } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'
import { leaveBalances } from '@/lib/hr'
import type { Employee } from '@/types'

/** Allocated, used, pending and remaining days per leave type for this year. */
export function LeaveBalanceCards({ employee }: { employee: Employee }) {
  const { data } = useHR()
  const balances = useMemo(() => leaveBalances(data, employee), [data, employee])
  if (balances.length === 0)
    return (
      <Card>
        <CardContent>
          <EmptyState icon={CalendarDays} title="No leave types yet" description="HR hasn't set up leave types. Balances will appear here once they do." />
        </CardContent>
      </Card>
    )
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {balances.map((b) => {
        const proRated = b.allocated < b.leave_type.yearly_quota
        const pct = b.allocated ? Math.max(0, Math.min(100, (b.remaining / b.allocated) * 100)) : 0
        return (
          <Card key={b.leave_type.id} size="sm">
            <CardContent>
              <p className="text-xs font-medium text-muted-foreground">{b.leave_type.name}</p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums">{b.remaining}</span>
                <span className="text-sm text-muted-foreground">/ {b.allocated} left</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 text-xs">
                <dt className="text-muted-foreground">Used</dt>
                <dd className="text-right tabular-nums">{b.used}</dd>
                <dt className="text-muted-foreground">Pending</dt>
                <dd className="text-right tabular-nums">{b.pending}</dd>
              </dl>
              {proRated && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Pro-rated for your first year (full quota {b.leave_type.yearly_quota})
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
