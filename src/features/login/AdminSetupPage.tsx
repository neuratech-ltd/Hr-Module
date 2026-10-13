import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { Field } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthLayout } from './AuthLayout'
import { MIN_PASSWORD, newPasswordErrors, PasswordInput, StrengthMeter } from './password'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** First run: there is no account yet, so the first HR/Admin creates their own. */
export function AdminSetupPage() {
  const { createAdmin } = useHR()
  const { signInAs } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState(false)

  const pw = newPasswordErrors(password, confirm)
  const errors = {
    name: !name.trim() ? 'Enter your full name.' : '',
    email: !email.trim() ? 'Enter your work email.' : !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address.' : '',
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
      signInAs(user.id)
      toast.success('Your HR/Admin account is ready.', { description: 'Start by adding departments and leave types.' })
      navigate('/admin', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the account.')
    }
  }

  return (
    <AuthLayout title="Create HR / Admin account" description="Welcome! Set up the first administrator account to get started.">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Full name" htmlFor="name" required error={show('name')}>
          <Input id="name" autoFocus autoComplete="name" className="h-9" value={name} aria-invalid={!!show('name')} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Work email" htmlFor="email" required error={show('email')} hint="You'll sign in with this.">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-9"
            value={email}
            aria-invalid={!!show('email')}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password" required error={show('password')} hint={`At least ${MIN_PASSWORD} characters.`}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className="h-9"
            value={password}
            aria-invalid={!!show('password')}
            onChange={(e) => setPassword(e.target.value)}
          />
          <StrengthMeter password={password} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" required error={show('confirm')}>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            className="h-9"
            value={confirm}
            aria-invalid={!!show('confirm')}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" className="mt-1 w-full">
          Create account
        </Button>
      </form>
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to sign in
      </Link>
    </AuthLayout>
  )
}
