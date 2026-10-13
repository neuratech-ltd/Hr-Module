import { useState } from 'react'
import { CalendarClock, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useHR } from '@/store/hr-store'
import { cn } from '@/lib/utils'
import { WEEKDAYS } from '@/lib/dates'
import { Field, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const SHORT = WEEKDAYS.map((d) => d.slice(0, 3))

/** "Sun–Thu" for a continuous run of working days, otherwise "Mon, Wed, Fri". */
function describeWeek(offDays: number[]): string {
  const working = [0, 1, 2, 3, 4, 5, 6].filter((d) => !offDays.includes(d))
  if (working.length === 0) return 'No working days'
  if (working.length === 7) return 'Every day'
  if (working.length === 1) return SHORT[working[0]!]!
  const start = working.find((d) => !working.includes((d + 6) % 7))
  if (start === undefined) return working.map((d) => SHORT[d]).join(', ')
  let end = start
  let length = 1
  while (working.includes((end + 1) % 7) && length < working.length) {
    end = (end + 1) % 7
    length++
  }
  if (length === working.length) return `${SHORT[start]}–${SHORT[end]}`
  return working.map((d) => SHORT[d]).join(', ')
}

export function AttendanceSettingsPage() {
  const { data, saveSettings } = useHR()
  const [startTime, setStartTime] = useState(data.settings.office_start_time)
  const [offDays, setOffDays] = useState<number[]>(data.settings.weekly_off_days)
  const [errors, setErrors] = useState<{ time?: string; days?: string }>({})

  const dirty =
    startTime !== data.settings.office_start_time ||
    [...offDays].sort().join() !== [...data.settings.weekly_off_days].sort().join()

  const toggleDay = (d: number) => {
    setOffDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
    setErrors((e) => ({ ...e, days: undefined }))
  }

  const reset = () => {
    setStartTime(data.settings.office_start_time)
    setOffDays(data.settings.weekly_off_days)
    setErrors({})
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!startTime) next.time = 'Enter the office start time.'
    if (offDays.length >= 7) next.days = 'At least one day must be a working day.'
    setErrors(next)
    if (next.time || next.days) return
    try {
      saveSettings({ office_start_time: startTime, weekly_off_days: [...offDays].sort() })
      toast.success('Office settings saved.')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Office settings" description="Working hours and weekly off days used for attendance." />

      <form onSubmit={save}>
        <Card>
          <CardHeader>
            <CardTitle>Working week</CardTitle>
            <CardDescription>These settings apply to every employee.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <Field
              label="Office start time"
              htmlFor="office-start"
              required
              error={errors.time}
              hint="Check-ins after this time can be reviewed as late arrivals."
            >
              <Input
                id="office-start"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  setErrors((x) => ({ ...x, time: undefined }))
                }}
                aria-invalid={!!errors.time}
                className="w-36"
              />
            </Field>

            <Field label="Weekly off days" error={errors.days} hint="Select the days the office is closed.">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Weekly off days">
                {SHORT.map((label, d) => {
                  const off = offDays.includes(d)
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={off}
                      title={WEEKDAYS[d]}
                      onClick={() => toggleDay(d)}
                      className={cn(
                        'h-9 w-12 rounded-lg border text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        off
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
              <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm">
                <span className="text-muted-foreground">Working week:</span>{' '}
                <span className="font-medium">{describeWeek(offDays)}</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span className="text-muted-foreground">Office starts</span>{' '}
                <span className="font-medium tabular-nums">{startTime || '—'}</span>
              </p>
            </div>

            <p className="flex gap-2 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              Weekly off days and public holidays are never marked absent, and they are not counted as leave days.
            </p>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t">
            <Button type="button" variant="ghost" onClick={reset} disabled={!dirty}>
              Discard
            </Button>
            <Button type="submit" disabled={!dirty}>
              Save changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
