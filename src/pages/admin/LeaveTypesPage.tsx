import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { CalendarClock, Check, Info, Paperclip, Pencil, Plus, Repeat, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHR } from '@/store/hr-store'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState, Field, NativeSelect, PageHeader } from '@/components/common'
import type { LeaveRule, LeaveType } from '@/types'

const RULES: Record<LeaveRule, { label: string; hint: string }> = {
  ADVANCE: { label: 'Apply in advance', hint: 'Must be requested before the leave starts.' },
  SAME_DAY_OR_AFTER: { label: 'Same day or after', hint: 'Requested on the day or after returning, e.g. sick leave.' },
  ANY: { label: 'Any time', hint: 'Can be requested before, on or after the day.' },
}

interface Draft {
  id?: number
  name: string
  yearly_quota: string
  rule: LeaveRule
  carry_forward: boolean
  allows_attachment: boolean
}

const NEW_DRAFT: Draft = { name: '', yearly_quota: '', rule: 'ADVANCE', carry_forward: false, allows_attachment: false }

function Flag({ on, icon: Icon, label }: { on: boolean; icon: typeof Repeat; label: string }) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium',
          on ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
        )}
      >
        {on ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        {on ? 'Yes' : 'No'}
      </span>
    </li>
  )
}

function LeaveTypeDialog({ draft, onClose }: { draft: Draft | null; onClose: () => void }) {
  const { saveLeaveType } = useHR()
  const [form, setForm] = useState<Draft>(NEW_DRAFT)
  const [errors, setErrors] = useState<{ name?: string; yearly_quota?: string }>({})
  const [opened, setOpened] = useState<Draft | null>(null)
  if (draft && draft !== opened) {
    setOpened(draft)
    setForm(draft)
    setErrors({})
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    const quota = Number(form.yearly_quota)
    const errs: typeof errors = {}
    if (!name) errs.name = 'Name is required.'
    if (form.yearly_quota.trim() === '') errs.yearly_quota = 'Yearly quota is required.'
    else if (!Number.isFinite(quota) || quota < 0 || quota > 365) errs.yearly_quota = 'Enter a number between 0 and 365.'
    else if (!Number.isInteger(quota * 2)) errs.yearly_quota = 'Use whole or half days (e.g. 10 or 10.5).'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      saveLeaveType(
        {
          name,
          yearly_quota: quota,
          rule: form.rule,
          carry_forward: form.carry_forward,
          allows_attachment: form.allows_attachment,
        },
        form.id,
      )
      toast.success(form.id ? `${name} updated.` : `${name} added.`)
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
      setErrors({ name: (err as Error).message })
    }
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit leave type' : 'Add leave type'}</DialogTitle>
            <DialogDescription>Set the yearly quota and when employees can apply.</DialogDescription>
          </DialogHeader>
          <Field label="Name" htmlFor="lt-name" required error={errors.name}>
            <Input
              id="lt-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
              placeholder="e.g. Casual Leave"
              autoFocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Yearly quota (days)" htmlFor="lt-quota" required error={errors.yearly_quota}>
              <Input
                id="lt-quota"
                type="number"
                inputMode="decimal"
                min={0}
                max={365}
                step={0.5}
                value={form.yearly_quota}
                onChange={(e) => setForm({ ...form, yearly_quota: e.target.value })}
                aria-invalid={!!errors.yearly_quota}
              />
            </Field>
            <Field label="Application rule" htmlFor="lt-rule" required>
              <NativeSelect
                id="lt-rule"
                value={form.rule}
                onChange={(e) => setForm({ ...form, rule: e.target.value as LeaveRule })}
              >
                {(Object.keys(RULES) as LeaveRule[]).map((r) => (
                  <option key={r} value={r}>
                    {RULES[r].label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">{RULES[form.rule].hint}</p>
          <div className="grid gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="lt-carry">Carry forward</Label>
                <p className="text-xs text-muted-foreground">Unused days roll over to next year.</p>
              </div>
              <Switch
                id="lt-carry"
                checked={form.carry_forward}
                onCheckedChange={(v) => setForm({ ...form, carry_forward: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="lt-attach">Allow attachment</Label>
                <p className="text-xs text-muted-foreground">Employees can attach documents, e.g. a prescription.</p>
              </div>
              <Switch
                id="lt-attach"
                checked={form.allows_attachment}
                onCheckedChange={(v) => setForm({ ...form, allows_attachment: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">{form.id ? 'Save changes' : 'Add leave type'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LeaveTypesPage() {
  const { data } = useHR()
  const [draft, setDraft] = useState<Draft | null>(null)

  const edit = (t: LeaveType) =>
    setDraft({
      id: t.id,
      name: t.name,
      yearly_quota: String(t.yearly_quota),
      rule: t.rule,
      carry_forward: t.carry_forward,
      allows_attachment: t.allows_attachment,
    })

  return (
    <div>
      <PageHeader
        title="Leave types"
        description="Leave categories, yearly quotas and application rules."
        actions={
          <Button onClick={() => setDraft({ ...NEW_DRAFT })}>
            <Plus /> Add leave type
          </Button>
        }
      />

      {data.leaveTypes.length === 0 ? (
        <Card>
          <EmptyState icon={SlidersHorizontal} title="No leave types yet" description="Add a leave type so employees can apply for leave." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.leaveTypes.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="icon-sm" onClick={() => edit(t)} aria-label={`Edit ${t.name}`}>
                    <Pencil />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p>
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">{t.yearly_quota}</span>
                  <span className="ml-1.5 text-sm text-muted-foreground">days / year</span>
                </p>
                <ul className="grid gap-2 border-t pt-3">
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      Rule
                    </span>
                    <span className="text-xs font-medium">{RULES[t.rule].label}</span>
                  </li>
                  <Flag on={t.carry_forward} icon={Repeat} label="Carry forward" />
                  <Flag on={t.allows_attachment} icon={Paperclip} label="Attachments" />
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" />
        Quotas are set by HR according to company policy. First-year balances are pro-rated from the joining date.
      </p>

      <LeaveTypeDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  )
}
