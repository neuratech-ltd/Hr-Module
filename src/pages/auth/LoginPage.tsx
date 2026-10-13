import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/auth/auth'
import { homeFor } from '@/components/layout/guards'
import { Field } from '@/components/common'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthLayout } from './AuthLayout'
import { PasswordInput } from './password'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const emailError = !email.trim() ? 'Enter your email.' : !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Enter a valid email address.' : ''
  const passwordError = !password ? 'Enter your password.' : ''

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (emailError || passwordError) return
    try {
      const user = login(email, password)
      navigate(from && from !== '/login' ? from : homeFor(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    }
  }

  return (
    <AuthLayout title="Welcome back" description="Sign in to NeuraTech HR.">
      <form onSubmit={submit} noValidate className="grid gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Field label="Email" htmlFor="email" error={touched ? emailError : undefined}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            className="h-9"
            value={email}
            aria-invalid={touched && !!emailError}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
          />
        </Field>
        <div className="grid gap-1.5">
          <Field label="Password" htmlFor="password" error={touched ? passwordError : undefined}>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              className="h-9"
              value={password}
              aria-invalid={touched && !!passwordError}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
            />
          </Field>
          <Link to="/forgot-password" className="justify-self-end text-xs text-muted-foreground hover:text-foreground">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="mt-1 w-full">
          Sign in
        </Button>
      </form>

    </AuthLayout>
  )
}
