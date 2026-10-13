import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHR } from '@/store/hr-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** First-run guide shown on the HR dashboard until the basics are set up. */
export function SetupChecklist() {
  const { data } = useHR()
  const steps = [
    { done: data.departments.length > 0, title: 'Add departments', text: 'e.g. Engineering, Finance', to: '/admin/departments' },
    { done: data.designations.length > 0, title: 'Add designations', text: 'Job titles used in the company', to: '/admin/departments' },
    { done: data.leaveTypes.length > 0, title: 'Set up leave types', text: 'Casual, Annual, Sick and their yearly quotas', to: '/admin/leave/types' },
    { done: data.holidays.length > 0, title: 'Add public holidays', text: 'Excluded from leave and attendance', to: '/admin/holidays' },
    { done: data.employees.length > 0, title: 'Create employee profiles', text: 'A login account is created for each', to: '/admin/employees/new' },
  ]
  const completed = steps.filter((s) => s.done).length
  if (completed === steps.length) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Get started</CardTitle>
        <CardDescription>
          {completed} of {steps.length} steps done. Set these up in order, then employees can sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} />
        </div>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Link
                to={s.to}
                className={cn(
                  'group flex h-full flex-col gap-2 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent/50',
                  s.done && 'bg-muted/40',
                )}
              >
                <span
                  className={cn(
                    'grid size-6 place-items-center rounded-full text-xs font-semibold',
                    s.done ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-primary/10 text-primary',
                  )}
                >
                  {s.done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={cn('text-sm font-medium', s.done && 'text-muted-foreground line-through')}>{s.title}</span>
                <span className="flex-1 text-xs text-muted-foreground">{s.text}</span>
                {!s.done && (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    Open <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
