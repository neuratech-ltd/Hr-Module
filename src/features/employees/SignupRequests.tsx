import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useHR } from '@/store/hr-store'
import { PersonAvatar } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fmtDate } from '@/lib/dates'
import type { User } from '@/types'

/** Employees who signed up themselves and are waiting for HR to complete their profile. */
export function SignupRequests() {
  const { data, rejectSignup } = useHR()
  const [declining, setDeclining] = useState<User | null>(null)
  const requests = data.users
    .filter((u) => u.role === 'EMPLOYEE' && !u.employee)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  if (requests.length === 0) return null

  return (
    <Card className="mb-6 ring-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="size-4 text-amber-600" />
          Sign-up requests
          <span className="rounded-full bg-amber-500/15 px-2 text-xs font-semibold text-amber-700 tabular-nums dark:text-amber-400">
            {requests.length}
          </span>
        </CardTitle>
        <CardDescription>Complete each profile so the employee can sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {requests.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <PersonAvatar name={u.name} className="size-9" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email} · {u.phone} · requested {fmtDate(u.created_at.slice(0, 10))}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeclining(u)}>
                  Decline
                </Button>
                <Button size="sm" render={<Link to={`/admin/employees/new?request=${u.id}`} />}>
                  Complete profile
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <Dialog open={!!declining} onOpenChange={(open) => !open && setDeclining(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline {declining?.name}'s request?</DialogTitle>
            <DialogDescription>The pending account for {declining?.email} will be removed. They can sign up again later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (!declining) return
                rejectSignup(declining.id)
                toast.success(`Request from ${declining.name} declined.`)
                setDeclining(null)
              }}
            >
              Decline request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
