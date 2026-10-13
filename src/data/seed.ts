// Starting state of the HR data: completely empty. On first run the app asks
// for an HR/Admin account to be created, then HR sets everything else up.
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

export function createInitialData(): HRData {
  return {
    users: [],
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
