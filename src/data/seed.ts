// Starting state of the HR data: the company's department and designation lists
// plus two default logins (one HR/Admin, one employee). HR sets everything else up.
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
import { nextEmployeeId, nextId } from '@/lib/hr'

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

/** Default logins. Change these passwords after first sign-in. */
export const DEFAULT_ADMIN = { name: 'HR Admin', email: 'admin@neuratech.com', password: 'Admin@123' }
export const DEFAULT_EMPLOYEE = { name: 'Default Employee', email: 'employee@neuratech.com', password: 'Employee@123' }

/** Adds the default HR/Admin and employee logins if their emails are not taken yet. */
export function withDefaultAccounts(data: HRData): HRData {
  const has = (email: string) => data.users.some((u) => u.email.toLowerCase() === email)
  const now = new Date().toISOString()
  let d = data
  if (!has(DEFAULT_ADMIN.email)) {
    d = {
      ...d,
      users: [
        ...d.users,
        {
          id: nextId(d.users),
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
          role: 'ADMIN',
          is_active: true,
          employee: null,
          name: DEFAULT_ADMIN.name,
          phone: '',
          created_at: now,
        },
      ],
    }
  }
  if (!has(DEFAULT_EMPLOYEE.email) && !d.employees.some((e) => e.email.toLowerCase() === DEFAULT_EMPLOYEE.email)) {
    const department = d.departments.find((x) => x.name === 'IT') ?? d.departments[0]
    const designation = d.designations.find((x) => x.title === 'Junior Software Engineer') ?? d.designations[0]
    if (department && designation) {
      const employee: Employee = {
        id: nextId(d.employees),
        employee_id: nextEmployeeId(d),
        full_name: DEFAULT_EMPLOYEE.name,
        email: DEFAULT_EMPLOYEE.email,
        phone: '+8801700000000',
        gender: 'OTHER',
        date_of_birth: '1995-01-01',
        department: department.id,
        designation: designation.id,
        joining_date: '2026-01-01',
        employment_type: 'PERMANENT',
        status: 'ACTIVE',
        address: 'Dhaka, Bangladesh',
        nid: '',
        blood_group: '',
        emergency_contact: { name: '', phone: '' },
        photo: null,
      }
      d = {
        ...d,
        employees: [...d.employees, employee],
        users: [
          ...d.users,
          {
            id: nextId(d.users),
            email: DEFAULT_EMPLOYEE.email,
            password: DEFAULT_EMPLOYEE.password,
            role: 'EMPLOYEE',
            is_active: true,
            employee: employee.id,
            name: DEFAULT_EMPLOYEE.name,
            phone: employee.phone,
            created_at: now,
          },
        ],
      }
    }
  }
  return d
}

export function createInitialData(): HRData {
  return withDefaultAccounts(createEmptyData())
}

function createEmptyData(): HRData {
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
