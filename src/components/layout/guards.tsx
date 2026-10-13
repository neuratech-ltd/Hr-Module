import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import type { Role } from '@/types'

export const homeFor = (role: Role) => (role === 'ADMIN' ? '/admin' : '/dashboard')

/** Requires a signed-in user, optionally with a specific role. */
export function RequireAuth({ role }: { role?: Role }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}

const useHasAdmin = () => useHR().data.users.some((u) => u.role === 'ADMIN')

/** Login & password pages: signed-in users go home; before any admin exists, go to setup. */
export function GuestOnly() {
  const { user } = useAuth()
  const hasAdmin = useHasAdmin()
  if (user) return <Navigate to={homeFor(user.role)} replace />
  if (!hasAdmin) return <Navigate to="/setup" replace />
  return <Outlet />
}

/** First-run page, only reachable while no HR/Admin account exists. */
export function SetupOnly() {
  const hasAdmin = useHasAdmin()
  if (hasAdmin) return <Navigate to="/login" replace />
  return <Outlet />
}

export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />
}
