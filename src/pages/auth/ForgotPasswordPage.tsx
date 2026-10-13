import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Field } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const error = !email.trim() ? 'Enter your email.' : !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Enter a valid email address.' : ''

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!error) setSentTo(email.trim())
  }

  const back = (
    <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" />
      Back to sign in
    </Link>
  )

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="grid gap-4">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-5" />
          </span>
          <p className="text-sm">
            If an account exists for <span className="font-medium">{sentTo}</span>, we've sent a reset link.
          </p>
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            No email is sent in this demo.{' '}
            <Link
              to={`/reset-password?email=${encodeURIComponent(sentTo)}`}
              className="font-medium text-foreground underline underline-offset-3"
            >
              Open reset link (demo)
            </Link>
          </p>
        </div>
        {back}
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot password?" description="Enter your work email and we'll send you a link to reset it.">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Email" htmlFor="email" required error={touched ? error : undefined}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            className="h-9"
            value={email}
            aria-invalid={touched && !!error}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Send reset link
        </Button>
      </form>
      {back}
    </AuthLayout>
  )
}
