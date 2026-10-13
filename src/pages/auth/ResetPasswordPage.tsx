import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth'
import { Field } from '@/components/common'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { MIN_PASSWORD, PasswordInput, StrengthMeter, newPasswordErrors } from './password'

export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''

  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(email ? '' : 'This reset link is invalid or has expired.')

  const errors = newPasswordErrors(next, confirm)
  const valid = !!email && !errors.next && !errors.confirm

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    try {
      resetPassword(email, next)
      toast.success('Password updated. Sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.')
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      description={email ? <>For <span className="font-medium text-foreground">{email}</span></> : undefined}
    >
      <form onSubmit={submit} noValidate className="grid gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {error} <Link to="/forgot-password">Request a new link</Link>
            </AlertDescription>
          </Alert>
        )}
        <Field
          label="New password"
          htmlFor="next"
          required
          error={next ? errors.next : undefined}
          hint={`At least ${MIN_PASSWORD} characters.`}
        >
          <PasswordInput
            id="next"
            autoComplete="new-password"
            autoFocus
            className="h-9"
            value={next}
            aria-invalid={!!next && !!errors.next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <StrengthMeter password={next} />
        <Field label="Confirm password" htmlFor="confirm" required error={confirm ? errors.confirm : undefined}>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            className="h-9"
            value={confirm}
            aria-invalid={!!confirm && !!errors.confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={!valid}>
          Update password
        </Button>
      </form>
      <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
