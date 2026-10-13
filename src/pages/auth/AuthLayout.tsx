import type { ReactNode } from 'react'
import { CalendarCheck2, CalendarDays, UsersRound } from 'lucide-react'

const FEATURES = [
  { icon: UsersRound, title: 'Employee profiles', text: 'One tidy record for every person on the team.' },
  { icon: CalendarCheck2, title: 'Attendance', text: 'One-click check-in and a clear monthly calendar.' },
  { icon: CalendarDays, title: 'Leave', text: 'Apply, approve and track balances in seconds.' },
]

function Logo() {
  return <img src="/logo.png" alt="NeuraTech Ltd." width={696} height={227} className="h-11 w-auto self-start object-contain" />
}

/** Split screen used by the sign-in and password pages. */
export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-sm flex-col">
            <div className="mb-10">
              <Logo />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} NeuraTech Ltd. · NeuraTech HR</p>
      </div>

      <aside className="relative hidden overflow-hidden border-l bg-linear-to-br from-primary/[0.07] via-background to-chart-2/[0.08] lg:flex lg:items-center lg:justify-center lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-chart-2/10 blur-3xl" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="size-8 rounded-lg" />
            <p className="text-xs font-medium tracking-widest text-primary uppercase">NeuraTech HR</p>
          </div>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-balance">
            Everything your people need, in one calm place.
          </h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-foreground/5">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
