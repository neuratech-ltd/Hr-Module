# NeuraTech HR — HR Module (frontend)

Frontend for the HR Module SRS: employee profiles, attendance (Present / Absent) and leave
(Casual / Annual / Sick), with an HR/Admin panel and an employee self-service portal.

**Stack:** React + Vite + TypeScript, React Router, shadcn/ui (base-ui), Tailwind CSS.

> Frontend only — there is no backend yet. All data lives in an in-browser store
> (`src/store/hr-store.tsx`) saved to `localStorage`. The app starts **empty**.

## Run

```bash
npm install
npm run dev
```

## First run

1. Open the app — the login page appears. On the **HR / Admin** tab, click **Create HR / Admin account** to create the first admin (this button disappears once an admin exists).
2. Departments and designations come pre-filled with the company lists (editable under **Departments**). Follow the **Get started** checklist on the dashboard: departments → designations →
   leave types → holidays → employees.
3. Employee profiles are created in two ways:
   - **HR / Admin** adds them under **Employees -> Add employee** and sets the login password (SRS 3).
   - An employee clicks **Create account** on the login page and fills in their own full profile
     and password; they are signed in straight away. (Departments must exist first.)
4. More HR/Admin logins can be added under **HR users**.

The login page has separate **Employee** and **HR / Admin** tabs.
**Reset all data** in the user menu erases everything in this browser.

## Structure

One folder per feature:

```
src/
  features/
    login/            sign in (Employee / HR tabs), sign up, first-run admin setup,
                      forgot / reset / change password
    dashboard/        HR dashboard + setup checklist, employee dashboard
    create-profile/   add / edit employee profile (sets the login password)
    employees/        employee list, detail, sign-up requests
    hr-users/         HR / Admin accounts
    my-profile/       employee's own profile + self-service edit
    departments/      departments & designations
    attendance/       check-in / out, my attendance calendar, daily attendance, office settings
    leave/            apply, my leave, balances, approvals, history, leave types
    holidays/         holiday calendar
    reports/          attendance / leave / employee reports, Excel & PDF export
  components/         app layout, route guards, shared UI, shadcn/ui
  store/              in-browser data store + actions
  auth/               login session
  lib/                business rules (hr.ts), dates, formatting, export
  hooks/              shared hooks
  types/              domain types (SRS §7)
```

## Connecting the backend later

Screens only talk to `useHR()` and `useAuth()`. When the Django API is ready, re-implement those
hooks on top of `src/lib/api.ts` (Axios + JWT); the feature folders stay the same.
