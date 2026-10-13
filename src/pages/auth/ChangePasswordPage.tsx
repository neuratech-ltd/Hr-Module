import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth'
import { Field, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MIN_PASSWORD, PasswordInput, StrengthMeter, newPasswordErrors } from './password'

export function ChangePasswordPage() {
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [currentError, setCurrentError] = useState('')

  const errors = newPasswordErrors(next, confirm, current)
  const valid = !!current && !errors.next && !errors.confirm

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    try {
      changePassword(current, next)
      toast.success('Your password has been changed.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not change password.'
      setCurrentError(message)
      toast.error(message)
    }
  }

  return (
    <>
      <PageHeader title="Change password" description="Keep your account secure with a strong, unique password." />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Update password</CardTitle>
          <CardDescription>You'll stay signed in on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <Field label="Current password" htmlFor="current" required error={currentError || undefined}>
              <PasswordInput
                id="current"
                autoComplete="current-password"
                value={current}
                aria-invalid={!!currentError}
                onChange={(e) => {
                  setCurrent(e.target.value)
                  setCurrentError('')
                }}
              />
            </Field>
            <Field
              label="New password"
              htmlFor="next"
              required
              error={next ? errors.next : undefined}
              hint={`At least ${MIN_PASSWORD} characters, different from your current one.`}
            >
              <PasswordInput
                id="next"
                autoComplete="new-password"
                value={next}
                aria-invalid={!!next && !!errors.next}
                onChange={(e) => setNext(e.target.value)}
              />
            </Field>
            <StrengthMeter password={next} />
            <Field label="Confirm new password" htmlFor="confirm" required error={confirm ? errors.confirm : undefined}>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                value={confirm}
                aria-invalid={!!confirm && !!errors.confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={!valid}>
                Change password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
