import { Suspense, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  Clock,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PersonAvatar } from '@/components/common'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}
interface NavGroup {
  label: string
  items: NavItem[]
}

function useNav(): NavGroup[] {
  const { user } = useAuth()
  const { data } = useHR()
  if (user?.role === 'ADMIN') {
    const pending = data.leaveRequests.filter((l) => l.status === 'PENDING').length
    return [
      { label: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
      {
        label: 'People',
        items: [
          { to: '/admin/employees', label: 'Employees', icon: Users },
          { to: '/admin/departments', label: 'Departments', icon: Building2 },
          { to: '/admin/users', label: 'HR users', icon: ShieldCheck },
        ],
      },
      {
        label: 'Attendance',
        items: [
          { to: '/admin/attendance', label: 'Daily attendance', icon: CalendarCheck2 },
          { to: '/admin/attendance/settings', label: 'Office settings', icon: Settings2 },
        ],
      },
      {
        label: 'Leave',
        items: [
          { to: '/admin/leave/approvals', label: 'Approvals', icon: ClipboardCheck, badge: pending },
          { to: '/admin/leave/history', label: 'Leave history', icon: History },
          { to: '/admin/leave/types', label: 'Leave types', icon: SlidersHorizontal },
          { to: '/admin/holidays', label: 'Holiday calendar', icon: CalendarRange },
        ],
      },
      { label: 'Insights', items: [{ to: '/admin/reports', label: 'Reports', icon: BarChart3 }] },
    ]
  }
  return [
    {
      label: 'Menu',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/attendance', label: 'My attendance', icon: Clock },
        { to: '/leave', label: 'My leave', icon: CalendarDays },
        { to: '/profile', label: 'My profile', icon: UserRound },
      ],
    },
  ]
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <img src="/logo-mark.png" alt="" className="size-8 rounded-md" />
      <div className="leading-tight">
        <p className="text-sm font-semibold text-primary">NeuraTech Ltd.</p>
        <p className="text-[11px] text-muted-foreground">HR Module</p>
      </div>
    </div>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const groups = useNav()
  return (
    <nav className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-2.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{g.label}</p>
          <ul className="grid gap-0.5">
            {g.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <item.icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {!!item.badge && (
                    <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function UserMenu() {
  const { user, employee, logout } = useAuth()
  const { resetAllData } = useHR()
  const navigate = useNavigate()
  if (!user) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-2.5 rounded-lg p-1 pr-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50" />
        }
      >
        <PersonAvatar name={user.name} photo={employee?.photo} className="size-8" />
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="block text-xs text-muted-foreground">{user.role === 'ADMIN' ? 'HR / Admin' : 'Employee'}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === 'EMPLOYEE' && (
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <UserRound /> My profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate('/change-password')}>
          <KeyRound /> Change password
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (window.confirm('Erase all employees, attendance and leave data in this browser?')) resetAllData()
          }}
        >
          <RotateCcw /> Reset all data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Always-visible sign-out at the bottom of the sidebar. */
function SidebarFooter() {
  const { user, employee, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  return (
    <div className="grid gap-3 border-t pt-4">
      <div className="flex items-center gap-2.5 px-1">
        <PersonAvatar name={user.name} photo={employee?.photo} className="size-8" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
        onClick={() => {
          logout()
          navigate('/login')
        }}
      >
        <LogOut /> Log out
      </Button>
    </div>
  )
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-svh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r bg-sidebar px-3 py-5 lg:flex">
        <Brand />
        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          <SidebarNav />
        </div>
        <SidebarFooter />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-6 px-3 py-5">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Brand />
          <div className="flex-1 overflow-y-auto">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
          <SidebarFooter />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
          <p className="hidden text-sm text-muted-foreground sm:block">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Suspense fallback={<div className="grid min-h-40 place-items-center text-sm text-muted-foreground">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
