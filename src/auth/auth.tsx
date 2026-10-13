// Frontend-only login: checks the sample accounts in the HR store.
// Swap login/logout for the JWT API calls once the backend exists.
import { createContext, useContext, useState, type ReactNode } from 'react'
import { useHR } from '@/store/hr-store'
import type { Employee, Role, User } from '@/types'

const SESSION_KEY = 'hr-module-session'

interface AuthContextValue {
  user: User | null
  employee: Employee | null
  /** Signs in; when `role` is given the account must have that role. */
  login: (email: string, password: string, role?: Role) => User
  /** Starts a session for an account that was just created (first-run admin). */
  signInAs: (userId: number) => void
  logout: () => void
  changePassword: (current: string, next: string) => void
  resetPassword: (email: string, next: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): number | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, setPassword } = useHR()
  const [userId, setUserId] = useState<number | null>(readSession)

  const user = data.users.find((u) => u.id === userId && u.is_active) ?? null
  const employee = user?.employee ? (data.employees.find((e) => e.id === user.employee) ?? null) : null

  const persist = (id: number | null) => {
    setUserId(id)
    try {
      if (id) localStorage.setItem(SESSION_KEY, String(id))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // Session only lasts for this tab if storage is blocked.
    }
  }

  const value: AuthContextValue = {
    user,
    employee,
    login(email, password, role) {
      const found = data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!found || found.password !== password) throw new Error('Invalid email or password.')
      if (role && found.role !== role)
        throw new Error(
          role === 'ADMIN'
            ? 'This is not an HR/Admin account. Use the Employee tab to sign in.'
            : 'This is an HR/Admin account. Use the HR / Admin tab to sign in.',
        )
      if (found.role === 'EMPLOYEE' && !found.employee)
        throw new Error('Your account is waiting for HR to complete your profile. Please check back later.')
      if (!found.is_active) throw new Error('Your account is inactive. Please contact HR.')
      persist(found.id)
      return found
    },
    signInAs: (userId) => persist(userId),
    logout: () => persist(null),
    changePassword(current, next) {
      if (!user) throw new Error('Not signed in.')
      if (user.password !== current) throw new Error('Current password is incorrect.')
      setPassword(user.id, next)
    },
    resetPassword(email, next) {
      const found = data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!found) throw new Error('This reset link is invalid or has expired.')
      setPassword(found.id, next)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
