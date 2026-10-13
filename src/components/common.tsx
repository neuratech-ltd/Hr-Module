// Small building blocks shared by every page.
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/lib/hr'
import type { DayStatus, EmployeeStatus, LeaveStatus } from '@/types'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const tones = {
  neutral: 'bg-muted text-foreground',
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  red: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  blue: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
}
export type Tone = keyof typeof tones

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  hint,
}: {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone?: Tone
  hint?: ReactNode
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', tones[tone])}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  )
}

export function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent', tones[tone])}>
      {children}
    </Badge>
  )
}

export const dayStatusMeta: Record<DayStatus, { label: string; tone: Tone; dot: string }> = {
  PRESENT: { label: 'Present', tone: 'green', dot: 'bg-emerald-500' },
  ABSENT: { label: 'Absent', tone: 'red', dot: 'bg-rose-500' },
  LEAVE: { label: 'On leave', tone: 'blue', dot: 'bg-sky-500' },
  HOLIDAY: { label: 'Holiday', tone: 'violet', dot: 'bg-violet-500' },
  WEEKEND: { label: 'Weekend', tone: 'neutral', dot: 'bg-muted-foreground/40' },
  NOT_MARKED: { label: 'Not marked', tone: 'amber', dot: 'bg-amber-500' },
  UPCOMING: { label: '—', tone: 'neutral', dot: 'bg-transparent' },
}

export function DayStatusBadge({ status }: { status: DayStatus }) {
  const m = dayStatusMeta[status]
  return <ToneBadge tone={m.tone}>{m.label}</ToneBadge>
}

const leaveTone: Record<LeaveStatus, Tone> = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', CANCELLED: 'neutral' }

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return <ToneBadge tone={leaveTone[status]}>{status[0] + status.slice(1).toLowerCase()}</ToneBadge>
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return <ToneBadge tone={status === 'ACTIVE' ? 'green' : 'neutral'}>{status === 'ACTIVE' ? 'Active' : 'Inactive'}</ToneBadge>
}

export function PersonAvatar({ name, photo, className }: { name: string; photo?: string | null; className?: string }) {
  return (
    <Avatar className={className}>
      {photo && <AvatarImage src={photo} alt={name} />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

/** Label + control + error/hint, used by every form. */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

/** Native select styled like the shadcn input; simpler for long, plain option lists. */
export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground',
        className,
      )}
      {...props}
    />
  )
}
