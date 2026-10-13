// Starting state of the HR data: empty except for the HR/Admin login,
// so HR can sign in and set up departments, leave types, holidays and employees.
import type {
  AttendanceRecord,
  AttendanceSettings,
  Department,
  Designation,
  Employee,
  Holiday,
  LeaveRequest,
  LeaveType,
  User,
} from '@/types'

export interface HRData {
  users: User[]
  departments: Department[]
  designations: Designation[]
  employees: Employee[]
  attendance: AttendanceRecord[]
  settings: AttendanceSettings
  leaveTypes: LeaveType[]
  leaveRequests: LeaveRequest[]
  holidays: Holiday[]
}

/** Default HR/Admin account. Change the password after first sign-in. */
export const DEFAULT_ADMIN = { email: 'admin@company.com', password: 'admin123' }

export function createInitialData(): HRData {
  return {
    users: [
      {
        id: 1,
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password,
        role: 'ADMIN',
        is_active: true,
        employee: null,
        name: 'HR Admin',
      },
    ],
    departments: [],
    designations: [],
    employees: [],
    attendance: [],
    settings: { office_start_time: '09:00', weekly_off_days: [5, 6] },
    leaveTypes: [],
    leaveRequests: [],
    holidays: [],
  }
}
