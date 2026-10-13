import { useMemo, useState } from 'react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { CalendarHeart, CalendarRange, ChevronLeft, ChevronRight, Info, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useHR } from '@/store/hr-store'
import { cn } from '@/lib/utils'
import { todayISO } from '@/lib/dates'
import type { Holiday } from '@/types'
import { EmptyState, Field, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const inDays = (date: string, today: string) => {
  const n = differenceInCalendarDays(parseISO(date), parseISO(today))
  return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`
}

export function HolidaysPage() {
  const { data, saveHoliday, deleteHoliday } = useHR()
  const today = todayISO()
  const [year, setYear] = useState(new Date().getFullYear())
  const [editing, setEditing] = useState<Holiday | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Holiday | null>(null)

  const sorted = useMemo(() => [...data.holidays].sort((a, b) => a.date.localeCompare(b.date)), [data.holidays])
  const upcoming = sorted.find((h) => h.date >= today) ?? null
  const ofYear = sorted.filter((h) => h.date.startsWith(String(year)))

  const months = useMemo(() => {
    const groups = new Map<string, Holiday[]>()
    for (const h of ofYear) {
      const key = h.date.slice(0, 7)
      groups.set(key, [...(groups.get(key) ?? []), h])
    }
    return [...groups.entries()]
  }, [ofYear])

  const remaining = ofYear.filter((h) => h.date >= today).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday calendar"
        description="Public holidays observed by the company."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus /> Add holiday
          </Button>
        }
      />

      {upcoming && (
        <Card className="bg-gradient-to-br from-violet-500/10 via-card to-card">
          <CardContent className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
              <div className="text-center leading-none">
                <p className="text-[11px] font-medium uppercase">{format(parseISO(upcoming.date), 'MMM')}</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums">{format(parseISO(upcoming.date), 'd')}</p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Next holiday</p>
              <p className="truncate text-base font-semibold">{upcoming.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(upcoming.date), 'EEEE, d MMMM yyyy')} · {inDays(upcoming.date, today)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>{year}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ofYear.length} holiday{ofYear.length === 1 ? '' : 's'}
              {year === new Date().getFullYear() && ofYear.length > 0 && ` · ${remaining} remaining`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setYear(year - 1)} aria-label="Previous year">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setYear(year + 1)} aria-label="Next year">
              <ChevronRight />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title={`No holidays added for ${year}`}
              description="Add the public holidays your office observes."
            />
          ) : (
            <div className="grid gap-6">
              {months.map(([month, holidays]) => (
                <section key={month}>
                  <h3 className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {format(parseISO(`${month}-01`), 'MMMM')}
                  </h3>
                  <ul className="divide-y rounded-lg border">
                    {holidays.map((h) => {
                      const past = h.date < today
                      const isNext = upcoming?.id === h.id
                      return (
                        <li key={h.id} className={cn('flex items-center gap-3 px-3 py-2.5', isNext && 'bg-violet-500/5')}>
                          <div className={cn('w-14 shrink-0', past && 'text-muted-foreground')}>
                            <p className="text-sm font-semibold tabular-nums">{format(parseISO(h.date), 'd MMM')}</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(h.date), 'EEE')}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('truncate text-sm font-medium', past && 'text-muted-foreground')}>{h.name}</p>
                            {past ? (
                              <p className="text-xs text-muted-foreground">Passed</p>
                            ) : (
                              isNext && <p className="text-xs text-violet-700 dark:text-violet-400">{inDays(h.date, today)}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(h)} aria-label={`Edit ${h.name}`}>
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleting(h)}
                              aria-label={`Delete ${h.name}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="flex gap-2 text-xs text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" />
        Holidays are excluded from leave day counts and are never marked absent.
      </p>

      <HolidayDialog
        holiday={editing}
        defaultYear={year}
        onClose={() => setEditing(null)}
        onSave={(input, id) => {
          try {
            saveHoliday(input, id)
            toast.success(id ? 'Holiday updated.' : 'Holiday added.')
            setYear(Number(input.date.slice(0, 4)))
            return true
          } catch (err) {
            toast.error((err as Error).message)
            return false
          }
        }}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete holiday?</DialogTitle>
            <DialogDescription>
              {deleting && `${deleting.name} on ${format(parseISO(deleting.date), 'd MMMM yyyy')} will be removed. That day becomes a regular working day.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return
                try {
                  deleteHoliday(deleting.id)
                  toast.success('Holiday deleted.')
                  setDeleting(null)
                } catch (err) {
                  toast.error((err as Error).message)
                }
              }}
            >
              <Trash2 /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HolidayDialog({
  holiday,
  defaultYear,
  onClose,
  onSave,
}: {
  holiday: Holiday | 'new' | null
  defaultYear: number
  onClose: () => void
  onSave: (input: Omit<Holiday, 'id'>, id?: number) => boolean
}) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({})
  const [last, setLast] = useState(holiday)
  if (holiday !== last) {
    setLast(holiday)
    setErrors({})
    if (holiday === 'new') {
      setName('')
      setDate(defaultYear === new Date().getFullYear() ? '' : `${defaultYear}-01-01`)
    } else if (holiday) {
      setName(holiday.name)
      setDate(holiday.date)
    }
  }

  const editing = holiday && holiday !== 'new' ? holiday : null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Enter the holiday name.'
    if (!date) next.date = 'Pick a date.'
    setErrors(next)
    if (next.name || next.date) return
    if (onSave({ name: name.trim(), date }, editing?.id)) onClose()
  }

  return (
    <Dialog open={!!holiday} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarHeart className="size-4 text-muted-foreground" />
              {editing ? 'Edit holiday' : 'Add holiday'}
            </DialogTitle>
            <DialogDescription>Employees won't be expected at work on this day.</DialogDescription>
          </DialogHeader>
          <Field label="Name" htmlFor="holiday-name" required error={errors.name}>
            <Input
              id="holiday-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((x) => ({ ...x, name: undefined }))
              }}
              placeholder="e.g. Victory Day"
              aria-invalid={!!errors.name}
              autoFocus
            />
          </Field>
          <Field label="Date" htmlFor="holiday-date" required error={errors.date}>
            <Input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setErrors((x) => ({ ...x, date: undefined }))
              }}
              aria-invalid={!!errors.date}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save changes' : 'Add holiday'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
