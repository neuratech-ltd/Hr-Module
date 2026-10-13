// Domain types for the HR module (shapes follow SRS section 7).

export type Role = 'ADMIN' | 'EMPLOYEE'

export interface User {
  id: number
  email: string
  password: string
  role: Role
  is_active: boolean
  /** Linked employee profile. An EMPLOYEE user without one is a pending self sign-up. */
  employee: number | null
  name: string
  phone: string
  created_at: string
}

export interface Department {
  id: number
  name: string
  code: string
}

export interface Designation {
  id: number
  title: string
  department: number
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'INTERN'
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'

export interface EmergencyContact {
  name: string
  phone: string
}

export interface Employee {
  id: number
  employee_id: string
  full_name: string
  email: string
  phone: string
  gender: Gender
  date_of_birth: string
  department: number
  designation: number
  joining_date: string
  employment_type: EmploymentType
  status: EmployeeStatus
  address: string
  nid: string
  emergency_contact: EmergencyContact
  photo: string | null
}

export type EmployeeInput = Omit<Employee, 'id' | 'employee_id'>

export type SelfProfileInput = Pick<Employee, 'phone' | 'address' | 'emergency_contact'>

export type AttendanceStatus = 'PRESENT' | 'ABSENT'

export interface AttendanceRecord {
  id: number
  employee: number
  date: string
  check_in: string | null
  check_out: string | null
  status: AttendanceStatus
  remarks: string
  marked_by: string
}

/** How a day is shown on calendars and daily lists. */
export type DayStatus = AttendanceStatus | 'LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'NOT_MARKED' | 'UPCOMING'

export interface AttendanceSettings {
  office_start_time: string
  weekly_off_days: number[] // 0 = Sunday ... 6 = Saturday
}

export type LeaveRule = 'ADVANCE' | 'SAME_DAY_OR_AFTER' | 'ANY'

export interface LeaveType {
  id: number
  name: string
  yearly_quota: number
  carry_forward: boolean
  rule: LeaveRule
  allows_attachment: boolean
}

export interface LeaveBalance {
  leave_type: LeaveType
  year: number
  allocated: number
  used: number
  pending: number
  remaining: number
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeaveRequest {
  id: number
  employee: number
  leave_type: number
  start_date: string
  end_date: string
  total_days: number
  is_half_day: boolean
  reason: string
  attachment: string | null
  status: LeaveStatus
  approved_by: string | null
  comment: string
  created_at: string
}

export type LeaveRequestInput = Pick<
  LeaveRequest,
  'leave_type' | 'start_date' | 'end_date' | 'is_half_day' | 'reason' | 'attachment'
>

export interface Holiday {
  id: number
  name: string
  date: string
}
