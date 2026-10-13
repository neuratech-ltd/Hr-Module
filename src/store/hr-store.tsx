// In-browser HR data store. Frontend only: every action updates local state
// (kept in localStorage) so the screens are fully clickable without a backend.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createInitialData, type HRData } from '@/data/seed'
import type {
  AttendanceSettings,
  AttendanceStatus,
  Department,
  Designation,
  EmployeeInput,
  Holiday,
  LeaveRequestInput,
  LeaveType,
  SelfProfileInput,
} from '@/types'
import { countLeaveDays, employeeById, nextEmployeeId, nextId, recordOn, validateLeave } from '@/lib/hr'
import { todayISO } from '@/lib/dates'

const STORAGE_KEY = 'hr-module-data-v3'

function load(): HRData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as HRData
  } catch {
    // Ignore unreadable storage and start fresh.
  }
  return createInitialData()
}

/** Thrown by actions when a rule is broken; screens show the message. */
export class HRError extends Error {}

function useHRState() {
  const [data, setData] = useState<HRData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Storage full or blocked: the session still works in memory.
    }
  }, [data])

  const update = useCallback((fn: (d: HRData) => HRData) => setData(fn), [])

  const actions = useMemo(
    () => ({
      resetAllData: () => setData(createInitialData()),

      // ---- Accounts -----------------------------------------------------
      /** HR/Admin login account (first-run setup, or added by another admin). */
      createAdmin(input: { name: string; email: string; password: string }) {
        const email = input.email.trim().toLowerCase()
        if (data.users.some((u) => u.email.toLowerCase() === email))
          throw new HRError('An account with this email already exists.')
        const user = {
          id: nextId(data.users),
          email,
          password: input.password,
          role: 'ADMIN' as const,
          is_active: true,
          employee: null,
          name: input.name.trim(),
          phone: '',
          created_at: new Date().toISOString(),
        }
        update((d) => ({ ...d, users: [...d.users, user] }))
        return user
      },
      /** Employee self sign-up: creates a pending account until HR completes the profile. */
      registerEmployee(input: { name: string; email: string; phone: string; password: string }) {
        const email = input.email.trim().toLowerCase()
        if (data.users.some((u) => u.email.toLowerCase() === email))
          throw new HRError('An account with this email already exists. Try signing in instead.')
        update((d) => ({
          ...d,
          users: [
            ...d.users,
            {
              id: nextId(d.users),
              email,
              password: input.password,
              role: 'EMPLOYEE',
              is_active: true,
              employee: null,
              name: input.name.trim(),
              phone: input.phone.trim(),
              created_at: new Date().toISOString(),
            },
          ],
        }))
      },
      /** HR declines a sign-up request; the pending account is removed. */
      rejectSignup(userId: number) {
        update((d) => ({ ...d, users: d.users.filter((u) => !(u.id === userId && u.role === 'EMPLOYEE' && !u.employee)) }))
      },
      setUserActive(userId: number, active: boolean) {
        const target = data.users.find((u) => u.id === userId)
        const activeAdmins = data.users.filter((u) => u.role === 'ADMIN' && u.is_active)
        if (!active && target?.role === 'ADMIN' && activeAdmins.length <= 1)
          throw new HRError('There must be at least one active HR/Admin account.')
        update((d) => ({ ...d, users: d.users.map((u) => (u.id === userId ? { ...u, is_active: active } : u)) }))
      },

      setPassword(userId: number, password: string) {
        update((d) => ({ ...d, users: d.users.map((u) => (u.id === userId ? { ...u, password } : u)) }))
      },

      // ---- Employees --------------------------------------------------
      /**
       * Creates the profile and its login account. If the email belongs to a pending
       * self sign-up, that account is linked and keeps its own password unless HR sets one.
       */
      createEmployee(input: EmployeeInput, password?: string) {
        if (data.employees.some((e) => e.email.toLowerCase() === input.email.toLowerCase()))
          throw new HRError('An employee with this email already exists.')
        const existingUser = data.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase())
        if (existingUser && (existingUser.role === 'ADMIN' || existingUser.employee))
          throw new HRError('This email is already used by another account.')
        if (!existingUser && !password) throw new HRError('Set a password for the login account.')
        const employee = { ...input, id: nextId(data.employees), employee_id: nextEmployeeId(data) }
        // Creating a profile also creates (or links) the login account.
        update((d) => ({
          ...d,
          employees: [...d.employees, employee],
          users: existingUser
            ? d.users.map((u) =>
                u.id === existingUser.id
                  ? { ...u, employee: employee.id, name: input.full_name, is_active: input.status === 'ACTIVE', password: password || u.password }
                  : u,
              )
            : [
                ...d.users,
                {
                  id: nextId(d.users),
                  email: input.email,
                  password: password!,
                  role: 'EMPLOYEE',
                  is_active: input.status === 'ACTIVE',
                  employee: employee.id,
                  name: input.full_name,
                  phone: input.phone,
                  created_at: new Date().toISOString(),
                },
              ],
        }))
        return employee
      },
      updateEmployee(id: number, input: EmployeeInput) {
        if (data.employees.some((e) => e.id !== id && e.email.toLowerCase() === input.email.toLowerCase()))
          throw new HRError('An employee with this email already exists.')
        update((d) => ({
          ...d,
          employees: d.employees.map((e) => (e.id === id ? { ...e, ...input } : e)),
          users: d.users.map((u) =>
            u.employee === id ? { ...u, email: input.email, name: input.full_name, is_active: input.status === 'ACTIVE' } : u,
          ),
        }))
      },
      /** HR sets a new login password for an employee. */
      setEmployeePassword(employeeId: number, password: string) {
        update((d) => ({ ...d, users: d.users.map((u) => (u.employee === employeeId ? { ...u, password } : u)) }))
      },
      setEmployeeStatus(id: number, status: 'ACTIVE' | 'INACTIVE') {
        update((d) => ({
          ...d,
          employees: d.employees.map((e) => (e.id === id ? { ...e, status } : e)),
          users: d.users.map((u) => (u.employee === id ? { ...u, is_active: status === 'ACTIVE' } : u)),
        }))
      },
      updateSelfProfile(id: number, input: SelfProfileInput) {
        update((d) => ({ ...d, employees: d.employees.map((e) => (e.id === id ? { ...e, ...input } : e)) }))
      },
      updatePhoto(id: number, photo: string | null) {
        update((d) => ({ ...d, employees: d.employees.map((e) => (e.id === id ? { ...e, photo } : e)) }))
      },

      // ---- Departments & designations ---------------------------------
      saveDepartment(input: Omit<Department, 'id'>, id?: number) {
        if (data.departments.some((x) => x.id !== id && x.code.toLowerCase() === input.code.toLowerCase()))
          throw new HRError('Department code must be unique.')
        update((d) => ({
          ...d,
          departments: id
            ? d.departments.map((x) => (x.id === id ? { ...x, ...input } : x))
            : [...d.departments, { ...input, id: nextId(d.departments) }],
        }))
      },
      deleteDepartment(id: number) {
        if (data.employees.some((e) => e.department === id))
          throw new HRError('This department has employees and cannot be deleted.')
        update((d) => ({
          ...d,
          departments: d.departments.filter((x) => x.id !== id),
          designations: d.designations.filter((x) => x.department !== id),
        }))
      },
      saveDesignation(input: Omit<Designation, 'id'>, id?: number) {
        update((d) => ({
          ...d,
          designations: id
            ? d.designations.map((x) => (x.id === id ? { ...x, ...input } : x))
            : [...d.designations, { ...input, id: nextId(d.designations) }],
        }))
      },
      deleteDesignation(id: number) {
        if (data.employees.some((e) => e.designation === id))
          throw new HRError('This designation is assigned to employees and cannot be deleted.')
        update((d) => ({ ...d, designations: d.designations.filter((x) => x.id !== id) }))
      },

      // ---- Attendance -------------------------------------------------
      checkIn(employeeId: number) {
        const date = todayISO()
        if (recordOn(data, employeeId, date)) throw new HRError('You have already checked in today.')
        update((d) => ({
          ...d,
          attendance: [
            ...d.attendance,
            {
              id: nextId(d.attendance),
              employee: employeeId,
              date,
              check_in: new Date().toISOString(),
              check_out: null,
              status: 'PRESENT',
              remarks: '',
              marked_by: 'Self',
            },
          ],
        }))
      },
      checkOut(employeeId: number) {
        const rec = recordOn(data, employeeId, todayISO())
        if (!rec?.check_in) throw new HRError('Check in first.')
        if (rec.check_out) throw new HRError('You have already checked out today.')
        update((d) => ({
          ...d,
          attendance: d.attendance.map((a) => (a.id === rec.id ? { ...a, check_out: new Date().toISOString() } : a)),
        }))
      },
      /** Manual / bulk marking by HR. Existing records are left untouched; use correctAttendance for those. */
      markAttendance(date: string, employeeIds: number[], status: AttendanceStatus, markedBy: string) {
        update((d) => {
          const attendance = [...d.attendance]
          let id = nextId(attendance)
          for (const employee of employeeIds) {
            if (attendance.some((a) => a.employee === employee && a.date === date)) continue
            attendance.push({
              id: id++,
              employee,
              date,
              check_in: null,
              check_out: null,
              status,
              remarks: 'Marked by HR',
              marked_by: markedBy,
            })
          }
          return { ...d, attendance }
        })
      },
      /** Records are never deleted, only corrected with a mandatory remark. */
      correctAttendance(employeeId: number, date: string, status: AttendanceStatus, remarks: string, markedBy: string) {
        if (!remarks.trim()) throw new HRError('A remark is required to correct a record.')
        update((d) => {
          const existing = d.attendance.find((a) => a.employee === employeeId && a.date === date)
          if (existing)
            return {
              ...d,
              attendance: d.attendance.map((a) =>
                a.id === existing.id ? { ...a, status, remarks, marked_by: markedBy } : a,
              ),
            }
          return {
            ...d,
            attendance: [
              ...d.attendance,
              { id: nextId(d.attendance), employee: employeeId, date, check_in: null, check_out: null, status, remarks, marked_by: markedBy },
            ],
          }
        })
      },
      saveSettings(settings: AttendanceSettings) {
        update((d) => ({ ...d, settings }))
      },

      // ---- Leave ------------------------------------------------------
      applyLeave(employeeId: number, input: LeaveRequestInput) {
        const employee = employeeById(data, employeeId)!
        const error = validateLeave(data, employee, input)
        if (error) throw new HRError(error)
        update((d) => ({
          ...d,
          leaveRequests: [
            ...d.leaveRequests,
            {
              ...input,
              id: nextId(d.leaveRequests),
              employee: employeeId,
              total_days: countLeaveDays(d, input.start_date, input.end_date, input.is_half_day),
              status: 'PENDING',
              approved_by: null,
              comment: '',
              created_at: new Date().toISOString(),
            },
          ],
        }))
      },
      cancelLeave(id: number) {
        const req = data.leaveRequests.find((l) => l.id === id)
        if (req?.status !== 'PENDING') throw new HRError('Only pending requests can be cancelled.')
        update((d) => ({
          ...d,
          leaveRequests: d.leaveRequests.map((l) => (l.id === id ? { ...l, status: 'CANCELLED' } : l)),
        }))
      },
      decideLeave(id: number, status: 'APPROVED' | 'REJECTED', comment: string, approver: string) {
        if (status === 'REJECTED' && !comment.trim()) throw new HRError('Add a comment explaining the rejection.')
        update((d) => ({
          ...d,
          leaveRequests: d.leaveRequests.map((l) => (l.id === id ? { ...l, status, comment, approved_by: approver } : l)),
        }))
      },
      saveLeaveType(input: Omit<LeaveType, 'id'>, id?: number) {
        if (data.leaveTypes.some((t) => t.id !== id && t.name.toLowerCase() === input.name.toLowerCase()))
          throw new HRError('A leave type with this name already exists.')
        update((d) => ({
          ...d,
          leaveTypes: id
            ? d.leaveTypes.map((t) => (t.id === id ? { ...t, ...input } : t))
            : [...d.leaveTypes, { ...input, id: nextId(d.leaveTypes) }],
        }))
      },

      // ---- Holidays ---------------------------------------------------
      saveHoliday(input: Omit<Holiday, 'id'>, id?: number) {
        if (data.holidays.some((h) => h.id !== id && h.date === input.date))
          throw new HRError('There is already a holiday on this date.')
        update((d) => ({
          ...d,
          holidays: id
            ? d.holidays.map((h) => (h.id === id ? { ...h, ...input } : h))
            : [...d.holidays, { ...input, id: nextId(d.holidays) }],
        }))
      },
      deleteHoliday(id: number) {
        update((d) => ({ ...d, holidays: d.holidays.filter((h) => h.id !== id) }))
      },
    }),
    [data, update],
  )

  return { data, ...actions }
}

type HRStore = ReturnType<typeof useHRState>

const HRContext = createContext<HRStore | null>(null)

export function HRProvider({ children }: { children: ReactNode }) {
  const store = useHRState()
  return <HRContext.Provider value={store}>{children}</HRContext.Provider>
}

export function useHR() {
  const ctx = useContext(HRContext)
  if (!ctx) throw new Error('useHR must be used inside <HRProvider>')
  return ctx
}
