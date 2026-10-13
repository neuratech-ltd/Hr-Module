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

export const useHasAdmin = () => useHR().data.users.some((u) => u.role === 'ADMIN')

/** Login & password pages: signed-in users go straight to their home page. */
export function GuestOnly() {
  const { user } = useAuth()
  if (user) return <Navigate to={homeFor(user.role)} replace />
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
