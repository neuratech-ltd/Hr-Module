import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { AlertCircle, ArrowLeft, CalendarRange, CircleCheck, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { Field, NativeSelect, PageHeader } from '@/components/common'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { countLeaveDays, leaveBalances, validateLeave } from '@/lib/hr'
import { toISO, todayISO } from '@/lib/dates'
import type { Employee, LeaveType } from '@/types'
import { fmtDays } from './utils'

function ruleHint(t: LeaveType): string {
  switch (t.rule) {
    case 'ADVANCE':
      return 'Apply in advance — the start date must be after today.'
    case 'SAME_DAY_OR_AFTER':
      return t.allows_attachment
        ? 'Same day or after; a medical document can be attached.'
        : 'Apply on the same day or after.'
    default:
      return t.allows_attachment ? 'Any date; a supporting document can be attached.' : 'Can be applied for any date.'
  }
}

export function ApplyLeavePage() {
  const { employee } = useAuth()
  if (!employee) return null
  return <ApplyLeave employee={employee} />
}

function ApplyLeave({ employee }: { employee: Employee }) {
  const { data, applyLeave } = useHR()
  const navigate = useNavigate()
  const today = todayISO()

  const [typeId, setTypeId] = useState<number>(0)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [halfDay, setHalfDay] = useState(false)
  const [reason, setReason] = useState('')
  const [attachment, setAttachment] = useState<string | null>(null)
  const [reasonTouched, setReasonTouched] = useState(false)

  const type = data.leaveTypes.find((t) => t.id === typeId)
  const input = {
    leave_type: typeId,
    start_date: start,
    end_date: halfDay ? start : end,
    is_half_day: halfDay,
    reason: reason.trim(),
    attachment: type?.allows_attachment ? attachment : null,
  }

  const ready = !!type && !!start && !!input.end_date
  const ruleError = ready ? validateLeave(data, employee, input) : null
  const reasonError = !reason.trim() ? 'Please give a short reason.' : ''
  const canSubmit = ready && !ruleError && !reasonError

  const days = ready ? countLeaveDays(data, input.start_date, input.end_date, halfDay) : 0
  const holidaysInRange =
    ready && input.end_date >= input.start_date
      ? data.holidays.filter((h) => h.date >= input.start_date && h.date <= input.end_date).sort((a, b) => a.date.localeCompare(b.date))
      : []

  const balance = useMemo(() => {
    if (!type) return null
    const year = start ? parseISO(start).getFullYear() : new Date().getFullYear()
    return leaveBalances(data, employee, year).find((b) => b.leave_type.id === type.id) ?? null
  }, [data, employee, type, start])
  const available = balance ? balance.remaining - balance.pending : 0

  const minDate = type?.rule === 'ADVANCE' ? toISO(addDays(parseISO(today), 1)) : undefined
  const maxDate = type?.rule === 'SAME_DAY_OR_AFTER' ? today : undefined

  function submit(e: FormEvent) {
    e.preventDefault()
    setReasonTouched(true)
    if (!canSubmit) return
    try {
      applyLeave(employee.id, input)
      toast.success('Leave request submitted for approval.')
      navigate('/leave')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit the request.')
    }
  }

  return (
    <>
      <PageHeader
        title="Apply for leave"
        description="Weekends and public holidays are not counted against your balance."
        actions={
          <Button variant="ghost" render={<Link to="/leave" />}>
            <ArrowLeft />
            Back to my leave
          </Button>
        }
      />

      <form onSubmit={submit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Request details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Field label="Leave type" htmlFor="type" required hint={type ? ruleHint(type) : undefined}>
              <NativeSelect
                id="type"
                className="h-9"
                value={typeId || ''}
                onChange={(e) => {
                  setTypeId(Number(e.target.value))
                  setAttachment(null)
                }}
              >
                <option value="" disabled>
                  Select leave type
                </option>
                {data.leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
              <div>
                <Label htmlFor="half-day">Half day</Label>
                <p className="text-xs text-muted-foreground">Counts as ½ day on a single date.</p>
              </div>
              <Switch
                id="half-day"
                checked={halfDay}
                onCheckedChange={(v) => {
                  setHalfDay(v)
                  if (v) setEnd(start)
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date" htmlFor="start" required>
                <Input
                  id="start"
                  type="date"
                  className="h-9"
                  value={start}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => {
                    const v = e.target.value
                    setStart(v)
                    if (halfDay || !end || end < v) setEnd(v)
                  }}
                />
              </Field>
              <Field label="End date" htmlFor="end" required hint={halfDay ? 'Same as start for a half day.' : undefined}>
                <Input
                  id="end"
                  type="date"
                  className="h-9"
                  value={halfDay ? start : end}
                  min={start || minDate}
                  disabled={halfDay}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Reason" htmlFor="reason" required error={reasonTouched ? reasonError : undefined}>
              <Textarea
                id="reason"
                rows={3}
                placeholder="e.g. Family event out of town"
                value={reason}
                maxLength={500}
                aria-invalid={reasonTouched && !!reasonError}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setReasonTouched(true)}
              />
            </Field>

            {type?.allows_attachment && (
              <Field label="Attachment" htmlFor="attachment" hint="Optional · e.g. a medical certificate (PDF or image).">
                <Input
                  id="attachment"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="h-9 file:mr-2"
                  onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? null)}
                />
              </Field>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>{type ? type.name : 'Choose a leave type and dates'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CalendarRange className="size-5" />
                </span>
                <div>
                  <p className="text-2xl leading-none font-semibold tabular-nums">{days === 0.5 ? '½' : days}</p>
                  <p className="mt-1 text-xs text-muted-foreground">working {days === 1 || days === 0.5 ? 'day' : 'days'} counted</p>
                </div>
              </div>

              {holidaysInRange.length > 0 && (
                <div className="rounded-lg bg-muted/60 p-2.5 text-xs">
                  <p className="font-medium">Holidays in this range (not counted)</p>
                  <ul className="mt-1 grid gap-0.5 text-muted-foreground">
                    {holidaysInRange.map((h) => (
                      <li key={h.id}>
                        {format(parseISO(h.date), 'dd MMM')} · {h.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              <dl className="grid grid-cols-[1fr_auto] gap-y-2">
                <dt className="text-muted-foreground">Available balance</dt>
                <dd className="text-right tabular-nums">{balance ? fmtDays(available) : '—'}</dd>
                <dt className="text-muted-foreground">This request</dt>
                <dd className="text-right tabular-nums">{days ? `− ${fmtDays(days)}` : '—'}</dd>
                <dt className="font-medium">Balance after</dt>
                <dd className={`text-right font-semibold tabular-nums ${balance && available - days < 0 ? 'text-destructive' : ''}`}>
                  {balance ? fmtDays(available - days) : '—'}
                </dd>
              </dl>
              {balance && balance.pending > 0 && (
                <p className="text-xs text-muted-foreground">Includes {fmtDays(balance.pending)} already pending approval.</p>
              )}
            </CardContent>
          </Card>

          {ruleError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{ruleError}</AlertDescription>
            </Alert>
          ) : ready ? (
            <Alert>
              <CircleCheck className="text-emerald-600 dark:text-emerald-400" />
              <AlertDescription>Looks good — ready to send to HR for approval.</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info />
              <AlertDescription>Pick a leave type and dates to see how many days will be used.</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            Submit request
          </Button>
        </div>
      </form>
    </>
  )
}
