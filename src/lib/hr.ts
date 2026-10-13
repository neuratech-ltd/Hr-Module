// Business rules from the SRS, kept as pure functions over the HR data.
import { differenceInCalendarMonths, parseISO } from 'date-fns'
import type { HRData } from '@/data/seed'
import type { DayStatus, Employee, LeaveBalance, LeaveRequest, LeaveRequestInput } from '@/types'
import { eachDay, todayISO } from './dates'

export const holidayOn = (data: HRData, date: string) => data.holidays.find((h) => h.date === date) ?? null

export const isWeeklyOff = (data: HRData, date: string) =>
  data.settings.weekly_off_days.includes(parseISO(date).getDay())

export const isWorkingDay = (data: HRData, date: string) => !isWeeklyOff(data, date) && !holidayOn(data, date)

export const approvedLeaveOn = (data: HRData, employeeId: number, date: string) =>
  data.leaveRequests.find(
    (l) => l.employee === employeeId && l.status === 'APPROVED' && l.start_date <= date && l.end_date >= date,
  ) ?? null

export const recordOn = (data: HRData, employeeId: number, date: string) =>
  data.attendance.find((a) => a.employee === employeeId && a.date === date) ?? null

/**
 * Status of one employee on one day. A past working day with no check-in
 * counts as Absent (the day-end auto-absent job); weekends, holidays and
 * approved leave never do.
 */
export function dayStatus(data: HRData, employee: Employee, date: string): DayStatus {
  const record = recordOn(data, employee.id, date)
  if (record) return record.status
  const leave = approvedLeaveOn(data, employee.id, date)
  if (leave && !leave.is_half_day) return 'LEAVE'
  if (holidayOn(data, date)) return 'HOLIDAY'
  if (isWeeklyOff(data, date)) return 'WEEKEND'
  const today = todayISO()
  if (date > today || date < employee.joining_date) return 'UPCOMING'
  if (date < today) return 'ABSENT'
  return 'NOT_MARKED'
}

/** Leave days between two dates, excluding weekly off days and holidays. */
export function countLeaveDays(data: HRData, start: string, end: string, halfDay: boolean): number {
  if (!start || !end || end < start) return 0
  const days = eachDay(start, end).filter((d) => isWorkingDay(data, d)).length
  return halfDay ? (days > 0 ? 0.5 : 0) : days
}

/** Yearly allocation; the first year is pro-rated from the joining date by month. */
export function allocation(quota: number, joiningDate: string, year: number): number {
  const joined = parseISO(joiningDate)
  if (joined.getFullYear() > year) return 0
  if (joined.getFullYear() < year) return quota
  const months = 12 - differenceInCalendarMonths(joined, new Date(year, 0, 1))
  return Math.round(((quota * months) / 12) * 2) / 2
}

export function leaveBalances(data: HRData, employee: Employee, year = new Date().getFullYear()): LeaveBalance[] {
  return data.leaveTypes.map((lt) => {
    const mine = data.leaveRequests.filter(
      (l) => l.employee === employee.id && l.leave_type === lt.id && l.start_date.startsWith(String(year)),
    )
    const sum = (s: LeaveRequest['status']) =>
      mine.filter((l) => l.status === s).reduce((n, l) => n + l.total_days, 0)
    const allocated = allocation(lt.yearly_quota, employee.joining_date, year)
    const used = sum('APPROVED')
    const pending = sum('PENDING')
    return { leave_type: lt, year, allocated, used, pending, remaining: allocated - used }
  })
}

/** Returns an error message if the request breaks a leave rule, otherwise null. */
export function validateLeave(data: HRData, employee: Employee, input: LeaveRequestInput): string | null {
  const type = data.leaveTypes.find((t) => t.id === input.leave_type)
  if (!type) return 'Select a leave type.'
  if (!input.start_date || !input.end_date) return 'Select start and end dates.'
  if (input.end_date < input.start_date) return 'End date cannot be before start date.'
  if (input.is_half_day && input.start_date !== input.end_date) return 'A half-day leave must start and end on the same day.'
  const today = todayISO()
  if (type.rule === 'ADVANCE' && input.start_date <= today) return `${type.name} must be applied in advance.`
  if (type.rule === 'SAME_DAY_OR_AFTER' && input.start_date > today)
    return `${type.name} can only be applied on the same day or after.`
  const days = countLeaveDays(data, input.start_date, input.end_date, input.is_half_day)
  if (days === 0) return 'The selected dates are all weekends or holidays.'
  const overlap = data.leaveRequests.some(
    (l) =>
      l.employee === employee.id &&
      (l.status === 'PENDING' || l.status === 'APPROVED') &&
      l.start_date <= input.end_date &&
      l.end_date >= input.start_date,
  )
  if (overlap) return 'These dates overlap an existing leave request.'
  const balance = leaveBalances(data, employee, parseISO(input.start_date).getFullYear()).find(
    (b) => b.leave_type.id === type.id,
  )!
  const available = balance.remaining - balance.pending
  if (days > available) return `Not enough balance: ${days} day(s) requested, ${available} available.`
  return null
}

/** Next employee code, e.g. EMP-0014. */
export function nextEmployeeId(data: HRData): string {
  const max = Math.max(0, ...data.employees.map((e) => Number(e.employee_id.replace(/\D/g, ''))))
  return `EMP-${String(max + 1).padStart(4, '0')}`
}

export const nextId = (rows: { id: number }[]) => Math.max(0, ...rows.map((r) => r.id)) + 1

export const departmentName = (data: HRData, id: number) => data.departments.find((d) => d.id === id)?.name ?? '—'
export const designationTitle = (data: HRData, id: number) => data.designations.find((d) => d.id === id)?.title ?? '—'
export const employeeById = (data: HRData, id: number) => data.employees.find((e) => e.id === id)
export const leaveTypeName = (data: HRData, id: number) => data.leaveTypes.find((t) => t.id === id)?.name ?? '—'

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}
