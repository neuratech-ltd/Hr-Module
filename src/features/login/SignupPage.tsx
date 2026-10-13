import { Link } from 'react-router-dom'
import { EmployeeFormPage } from '@/features/create-profile/EmployeeFormPage'

/** "Create account" from the login page: a new employee fills in their own full profile. */
export function SignupPage() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/login" aria-label="NeuraTech HR, back to sign in">
            <img src="/logo.png" alt="NeuraTech Ltd." width={696} height={227} className="h-8 w-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        <EmployeeFormPage selfSignup />
      </main>
    </div>
  )
}
