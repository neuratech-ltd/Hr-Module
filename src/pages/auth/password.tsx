import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export const MIN_PASSWORD = 8

/** Rough strength score (0-3) for a gentle hint, not a hard rule. */
export function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' }
  const checks = [pw.length >= MIN_PASSWORD, /[A-Z]/.test(pw) && /[a-z]/.test(pw), /[\d\W_]/.test(pw), pw.length >= 12]
  const score = pw.length < MIN_PASSWORD ? 0 : Math.min(3, checks.filter(Boolean).length)
  const labels = ['Too short', 'Weak', 'Good', 'Strong']
  return { score, label: pw.length < MIN_PASSWORD ? labels[0]! : labels[score]! }
}

export function StrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password)
  if (!password) return null
  const colors = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500']
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn('h-1 flex-1 rounded-full bg-muted transition-colors', i <= Math.max(score, 1) && colors[score])}
          />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/** Password input with a show/hide toggle. */
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className={cn('pr-9', className)} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 grid w-9 place-items-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

/** Shared rule checks for new-password forms. */
export function newPasswordErrors(next: string, confirm: string, current?: string) {
  return {
    next:
      next.length < MIN_PASSWORD
        ? `Use at least ${MIN_PASSWORD} characters.`
        : current !== undefined && next === current
          ? 'New password must be different from the current one.'
          : '',
    confirm: confirm !== next ? 'Passwords do not match.' : '',
  }
}
