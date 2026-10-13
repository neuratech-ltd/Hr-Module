import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Hourglass } from 'lucide-react'
import { useHR } from '@/store/hr-store'
import { Field } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthLayout } from './AuthLayout'
import { MIN_PASSWORD, newPasswordErrors, PasswordInput, StrengthMeter } from './password'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,16}[0-9]$/

/** Employee self sign-up. HR completes the profile before the account can sign in. */
export function SignupPage() {
  const { registerEmployee } = useHR()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(false)

  const pw = newPasswordErrors(password, confirm)
  const errors = {
    name: !name.trim() ? 'Enter your full name.' : '',
    email: serverError || (!email.trim() ? 'Enter your work email.' : !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address.' : ''),
    phone: !phone.trim() ? 'Enter your phone number.' : !PHONE_RE.test(phone.trim()) ? 'Enter a valid phone number.' : '',
    password: pw.next,
    confirm: pw.next ? '' : pw.confirm,
  }
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined)

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (Object.values(errors).some(Boolean)) return
    try {
      registerEmployee({ name, email, phone, password })
      setDone(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not create the account.')
    }
  }

  if (done)
    return (
      <AuthLayout title="Account created" description="One more step before you can sign in.">
        <div className="grid gap-5">
          <div className="flex gap-3 rounded-xl border bg-muted/40 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <Hourglass className="size-4" />
            </span>
            <p className="text-sm text-muted-foreground">
              HR will review your request and complete your profile (department, designation, joining date). You can sign in
              with <span className="font-medium text-foreground">{email.trim().toLowerCase()}</span> once that's done.
            </p>
          </div>
          <Button size="lg" className="w-full" render={<Link to="/login" />}>
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    )

  return (
    <AuthLayout title="Create your account" description="For employees. HR approves new accounts before first sign-in.">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Full name" htmlFor="name" required error={show('name')}>
          <Input id="name" autoFocus autoComplete="name" className="h-9" value={name} aria-invalid={!!show('name')} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Work email" htmlFor="email" required error={show('email')}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-9"
            value={email}
            aria-invalid={!!show('email')}
            onChange={(e) => {
              setEmail(e.target.value)
              setServerError('')
            }}
          />
        </Field>
        <Field label="Phone number" htmlFor="phone" required error={show('phone')}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+8801711000000"
            className="h-9"
            value={phone}
            aria-invalid={!!show('phone')}
            onChange={(e) => setPhone(e.target.value)}
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
