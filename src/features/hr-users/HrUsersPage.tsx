import { useState, type FormEvent } from 'react'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { EmptyState, Field, PageHeader, PersonAvatar, ToneBadge } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fmtDate } from '@/lib/dates'
import { MIN_PASSWORD, newPasswordErrors, PasswordInput, StrengthMeter } from '@/features/login/password'
import type { User } from '@/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** HR/Admin login accounts: add more admins, deactivate or reactivate them. */
export function HrUsersPage() {
  const { data, setUserActive } = useHR()
  const { user: me } = useAuth()
  const [adding, setAdding] = useState(false)
  const [target, setTarget] = useState<User | null>(null)
  const admins = data.users.filter((u) => u.role === 'ADMIN').sort((a, b) => a.name.localeCompare(b.name))

  function toggle(u: User) {
    try {
      setUserActive(u.id, !u.is_active)
      toast.success(u.is_active ? `${u.name} can no longer sign in.` : `${u.name} can sign in again.`)
      setTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the account.')
    }
  }

  return (
    <>
      <PageHeader
        title="HR users"
        description="People who can sign in to the HR / Admin panel."
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus /> Add HR user
          </Button>
        }
      />

      <Card className="overflow-x-auto">
        {admins.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No HR users" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={u.name} className="size-8" />
                      <div className="leading-tight">
                        <p className="font-medium">
                          {u.name}
                          {u.id === me?.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(u.created_at.slice(0, 10))}</TableCell>
                  <TableCell>
                    <ToneBadge tone={u.is_active ? 'green' : 'neutral'}>{u.is_active ? 'Active' : 'Inactive'}</ToneBadge>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {u.id !== me?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={u.is_active ? 'text-destructive hover:text-destructive' : undefined}
                        onClick={() => setTarget(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Employee accounts are created from Employees → Add employee, or by employees signing up themselves.
      </p>

      {adding && <AddAdminDialog onClose={() => setAdding(false)} />}

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target?.is_active ? 'Deactivate' : 'Activate'} {target?.name}?</DialogTitle>
            <DialogDescription>
              {target?.is_active
                ? 'They will no longer be able to sign in. The account is kept and can be activated again.'
                : 'They will be able to sign in to the HR / Admin panel again.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant={target?.is_active ? 'destructive' : 'default'} onClick={() => target && toggle(target)}>
              {target?.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AddAdminDialog({ onClose }: { onClose: () => void }) {
  const { createAdmin } = useHR()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState('')

  const pw = newPasswordErrors(password, confirm)
  const errors = {
    name: !name.trim() ? 'Enter a name.' : '',
    email: serverError || (!email.trim() ? 'Enter an email.' : !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address.' : ''),
    password: pw.next,
    confirm: pw.next ? '' : pw.confirm,
  }
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined)

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (Object.values(errors).some(Boolean)) return
    try {
      const user = createAdmin({ name, email, password })
      toast.success(`${user.name} can now sign in as HR / Admin.`)
      onClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not create the account.')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add HR user</DialogTitle>
            <DialogDescription>They'll sign in on the HR / Admin tab with this email and password.</DialogDescription>
          </DialogHeader>
          <Field label="Full name" htmlFor="admin-name" required error={show('name')}>
            <Input id="admin-name" value={name} aria-invalid={!!show('name')} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="admin-email" required error={show('email')}>
            <Input
              id="admin-email"
              type="email"
              value={email}
              aria-invalid={!!show('email')}
              onChange={(e) => {
                setEmail(e.target.value)
                setServerError('')
              }}
            />
          </Field>
          <Field label="Password" htmlFor="admin-password" required error={show('password')} hint={`At least ${MIN_PASSWORD} characters.`}>
            <PasswordInput
              id="admin-password"
              autoComplete="new-password"
              value={password}
              aria-invalid={!!show('password')}
              onChange={(e) => setPassword(e.target.value)}
            />
            <StrengthMeter password={password} />
          </Field>
          <Field label="Confirm password" htmlFor="admin-confirm" required error={show('confirm')}>
            <PasswordInput
              id="admin-confirm"
              autoComplete="new-password"
              value={confirm}
              aria-invalid={!!show('confirm')}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Add HR user</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
