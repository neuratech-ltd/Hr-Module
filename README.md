# NeuraTech HR — HR Module (frontend)

Frontend for the HR Module SRS: employee profiles, attendance (Present / Absent) and leave
(Casual / Annual / Sick), with an HR/Admin panel and an employee self-service portal.

**Stack:** React + Vite + TypeScript, React Router, shadcn/ui (base-ui), Tailwind CSS.

> There is no backend yet. All data lives in an in-browser store (`src/store/hr-store.tsx`)
> seeded from `src/data/seed.ts` and saved to `localStorage`. Use **Reset sample data** in the
> user menu to start over.

## Run

```bash
npm install
npm run dev
```

## Demo accounts

| Role        | Email                     | Password      |
| ----------- | ------------------------- | ------------- |
| HR / Admin  | admin@company.com         | admin123      |
| Employee    | rahim.uddin@company.com   | employee123   |

Any other sample employee (`<name>@company.com`) also signs in with `employee123`.

## Structure

```
src/
  types/            domain types (SRS §7)
  data/seed.ts      sample data
  store/            in-browser data store + actions
  auth/             login session
  lib/hr.ts         business rules (working days, auto-absent, leave days, balances, validation)
  lib/export.ts     Excel (CSV) / PDF (print) export
  components/       layout, shared UI, attendance calendar, shadcn/ui
  pages/auth        login, forgot / reset / change password
  pages/employee    dashboard + check-in, attendance, leave, apply leave, profile
  pages/admin       dashboard, employees, departments, attendance, settings,
                    leave approvals / history / types, holidays, reports
```

## Connecting the backend later

Pages only talk to `useHR()` and `useAuth()`. When the Django API is ready, re-implement those
hooks on top of `src/lib/api.ts` (Axios + JWT) and React Query; page components stay the same.
