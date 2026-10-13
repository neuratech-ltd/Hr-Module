import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { GuestOnly, HomeRedirect, RequireAuth, SetupOnly } from '@/components/layout/guards'

// Each page loads on demand to keep the first load small.
const AdminSetupPage = lazy(() => import('@/features/login/AdminSetupPage').then((m) => ({ default: m.AdminSetupPage })))
const SignupPage = lazy(() => import('@/features/login/SignupPage').then((m) => ({ default: m.SignupPage })))
const HrUsersPage = lazy(() => import('@/features/hr-users/HrUsersPage').then((m) => ({ default: m.HrUsersPage })))
const LoginPage = lazy(() => import('@/features/login/LoginPage').then((m) => ({ default: m.LoginPage })))
const ForgotPasswordPage = lazy(() =>
  import('@/features/login/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/features/login/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
)
const ChangePasswordPage = lazy(() =>
  import('@/features/login/ChangePasswordPage').then((m) => ({
    default: m.ChangePasswordPage,
  })),
)
const EmployeeDashboard = lazy(() =>
  import('@/features/dashboard/EmployeeDashboard').then((m) => ({
    default: m.EmployeeDashboard,
  })),
)
const MyAttendancePage = lazy(() =>
  import('@/features/attendance/MyAttendancePage').then((m) => ({
    default: m.MyAttendancePage,
  })),
)
const MyLeavePage = lazy(() =>
  import('@/features/leave/MyLeavePage').then((m) => ({
    default: m.MyLeavePage,
  })),
)
const ApplyLeavePage = lazy(() =>
  import('@/features/leave/ApplyLeavePage').then((m) => ({
    default: m.ApplyLeavePage,
  })),
)
const MyProfilePage = lazy(() =>
  import('@/features/my-profile/MyProfilePage').then((m) => ({
    default: m.MyProfilePage,
  })),
)
const AdminDashboard = lazy(() =>
  import('@/features/dashboard/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  })),
)
const EmployeesPage = lazy(() =>
  import('@/features/employees/EmployeesPage').then((m) => ({
    default: m.EmployeesPage,
  })),
)
const EmployeeFormPage = lazy(() =>
  import('@/features/create-profile/EmployeeFormPage').then((m) => ({
    default: m.EmployeeFormPage,
  })),
)
const EmployeeDetailPage = lazy(() =>
  import('@/features/employees/EmployeeDetailPage').then((m) => ({
    default: m.EmployeeDetailPage,
  })),
)
const DepartmentsPage = lazy(() =>
  import('@/features/departments/DepartmentsPage').then((m) => ({
    default: m.DepartmentsPage,
  })),
)
const AttendancePage = lazy(() =>
  import('@/features/attendance/AttendancePage').then((m) => ({
    default: m.AttendancePage,
  })),
)
const AttendanceSettingsPage = lazy(() =>
  import('@/features/attendance/AttendanceSettingsPage').then((m) => ({
    default: m.AttendanceSettingsPage,
  })),
)
const LeaveApprovalsPage = lazy(() =>
  import('@/features/leave/LeaveApprovalsPage').then((m) => ({
    default: m.LeaveApprovalsPage,
  })),
)
const LeaveHistoryPage = lazy(() =>
  import('@/features/leave/LeaveHistoryPage').then((m) => ({
    default: m.LeaveHistoryPage,
  })),
)
const LeaveTypesPage = lazy(() =>
  import('@/features/leave/LeaveTypesPage').then((m) => ({
    default: m.LeaveTypesPage,
  })),
)
const HolidaysPage = lazy(() =>
  import('@/features/holidays/HolidaysPage').then((m) => ({
    default: m.HolidaysPage,
  })),
)
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })))

function PageFallback() {
  return <div className="grid min-h-40 place-items-center text-sm text-muted-foreground">Loading…</div>
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<SetupOnly />}>
          <Route path="/setup" element={<AdminSetupPage />} />
        </Route>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />

            <Route element={<RequireAuth role="EMPLOYEE" />}>
              <Route path="/dashboard" element={<EmployeeDashboard />} />
              <Route path="/attendance" element={<MyAttendancePage />} />
              <Route path="/leave" element={<MyLeavePage />} />
              <Route path="/leave/apply" element={<ApplyLeavePage />} />
              <Route path="/profile" element={<MyProfilePage />} />
            </Route>

            <Route path="/admin" element={<RequireAuth role="ADMIN" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/new" element={<EmployeeFormPage />} />
              <Route path="employees/:id" element={<EmployeeDetailPage />} />
              <Route path="employees/:id/edit" element={<EmployeeFormPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="users" element={<HrUsersPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="attendance/settings" element={<AttendanceSettingsPage />} />
              <Route path="leave/approvals" element={<LeaveApprovalsPage />} />
              <Route path="leave/history" element={<LeaveHistoryPage />} />
              <Route path="leave/types" element={<LeaveTypesPage />} />
              <Route path="holidays" element={<HolidaysPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
