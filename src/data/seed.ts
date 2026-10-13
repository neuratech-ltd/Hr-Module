// Starting state of the HR data: no accounts or records, only the company's
// department and designation lists. HR sets everything else up.
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

/** Company departments, available from the first run (HR can edit them). */
export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 1, name: 'Administration', code: 'ADM' },
  { id: 2, name: 'Accounts & Finance', code: 'ACF' },
  { id: 3, name: 'Sales & Marketing', code: 'SAM' },
  { id: 4, name: 'Graphics Design', code: 'GD' },
  { id: 5, name: 'IT', code: 'IT' },
]

/** Company designations, available from the first run (HR can edit them). */
export const DEFAULT_DESIGNATIONS: Designation[] = [
  'VP (Engineering)',
  'Manager',
  'Asst. Manager',
  'Executive',
  'Sr. Executive',
  'Network & System Administrator',
  'Junior Software Engineer',
  'Associate Software Development & Research Engineer',
  'Senior Business Development Executive',
].map((title, i) => ({ id: i + 1, title }))

export function createInitialData(): HRData {
  return {
    users: [],
    departments: DEFAULT_DEPARTMENTS,
    designations: DEFAULT_DESIGNATIONS,
    employees: [],
    attendance: [],
    settings: { office_start_time: '09:00', weekly_off_days: [5, 6] },
    leaveTypes: [],
    leaveRequests: [],
    holidays: [],
  }
}
