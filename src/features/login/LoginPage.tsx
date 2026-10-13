import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ShieldCheck, UserPlus, UserRound } from 'lucide-react'
import { useAuth } from '@/auth/auth'
import { homeFor, useHasAdmin } from '@/components/layout/guards'
import { Field } from '@/components/common'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Role } from '@/types'
import { AuthLayout } from './AuthLayout'
import { PasswordInput } from './password'

const ROLE_TEXT: Record<Role, { title: string; description: string }> = {
  ADMIN: { title: 'HR / Admin sign in', description: 'Manage employees, attendance and leave.' },
  EMPLOYEE: { title: 'Employee sign in', description: 'Check in, apply for leave and view your profile.' },
}

export function LoginPage() {
  const { login } = useAuth()
  const hasAdmin = useHasAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [role, setRole] = useState<Role>('EMPLOYEE')
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
      const user = login(email, password, role)
      // Only return to the page they came from if it belongs to their role.
      const back = from && from !== '/login' && (from.startsWith('/admin') === (user.role === 'ADMIN')) ? from : null
      navigate(back ?? homeFor(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    }
  }

  return (
    <AuthLayout title={ROLE_TEXT[role].title} description={ROLE_TEXT[role].description}>
      <Tabs
        value={role}
        onValueChange={(v) => {
          setRole(v as Role)
          setError('')
          setTouched(false)
        }}
        className="mb-6"
      >
        <TabsList className="h-9! w-full">
          <TabsTrigger value="EMPLOYEE">
            <UserRound /> Employee
          </TabsTrigger>
          <TabsTrigger value="ADMIN">
            <ShieldCheck /> HR / Admin
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
          Sign in as {role === 'ADMIN' ? 'HR / Admin' : 'employee'}
        </Button>
      </form>

      {role === 'EMPLOYEE' ? (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Don't have a profile yet?
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" size="lg" className="w-full" render={<Link to="/signup" />}>
            <UserPlus /> Create account
          </Button>
        </>
      ) : hasAdmin ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">HR/Admin accounts are added by an existing admin.</p>
      ) : (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            First time here?
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" size="lg" className="w-full" render={<Link to="/setup" />}>
            <ShieldCheck /> Create HR / Admin account
          </Button>
        </>
      )}
    </AuthLayout>
  )
}
