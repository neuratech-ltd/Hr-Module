import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { GuestOnly, HomeRedirect, RequireAuth } from '@/components/layout/guards'

// Each page loads on demand to keep the first load small.
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
)
const ChangePasswordPage = lazy(() =>
  import('@/pages/auth/ChangePasswordPage').then((m) => ({
    default: m.ChangePasswordPage,
  })),
)
const EmployeeDashboard = lazy(() =>
  import('@/pages/employee/EmployeeDashboard').then((m) => ({
    default: m.EmployeeDashboard,
  })),
)
const MyAttendancePage = lazy(() =>
  import('@/pages/employee/MyAttendancePage').then((m) => ({
    default: m.MyAttendancePage,
  })),
)
const MyLeavePage = lazy(() =>
  import('@/pages/employee/MyLeavePage').then((m) => ({
    default: m.MyLeavePage,
  })),
)
const ApplyLeavePage = lazy(() =>
  import('@/pages/employee/ApplyLeavePage').then((m) => ({
    default: m.ApplyLeavePage,
  })),
)
const MyProfilePage = lazy(() =>
  import('@/pages/employee/MyProfilePage').then((m) => ({
    default: m.MyProfilePage,
  })),
)
const AdminDashboard = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  })),
)
const EmployeesPage = lazy(() =>
  import('@/pages/admin/EmployeesPage').then((m) => ({
    default: m.EmployeesPage,
  })),
)
const EmployeeFormPage = lazy(() =>
  import('@/pages/admin/EmployeeFormPage').then((m) => ({
    default: m.EmployeeFormPage,
  })),
)
const EmployeeDetailPage = lazy(() =>
  import('@/pages/admin/EmployeeDetailPage').then((m) => ({
    default: m.EmployeeDetailPage,
  })),
)
const DepartmentsPage = lazy(() =>
  import('@/pages/admin/DepartmentsPage').then((m) => ({
    default: m.DepartmentsPage,
  })),
)
const AttendancePage = lazy(() =>
  import('@/pages/admin/AttendancePage').then((m) => ({
    default: m.AttendancePage,
  })),
)
const AttendanceSettingsPage = lazy(() =>
  import('@/pages/admin/AttendanceSettingsPage').then((m) => ({
    default: m.AttendanceSettingsPage,
  })),
)
const LeaveApprovalsPage = lazy(() =>
  import('@/pages/admin/LeaveApprovalsPage').then((m) => ({
    default: m.LeaveApprovalsPage,
  })),
)
const LeaveHistoryPage = lazy(() =>
  import('@/pages/admin/LeaveHistoryPage').then((m) => ({
    default: m.LeaveHistoryPage,
  })),
)
const LeaveTypesPage = lazy(() =>
  import('@/pages/admin/LeaveTypesPage').then((m) => ({
    default: m.LeaveTypesPage,
  })),
)
const HolidaysPage = lazy(() =>
  import('@/pages/admin/HolidaysPage').then((m) => ({
    default: m.HolidaysPage,
  })),
)
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage').then((m) => ({ default: m.ReportsPage })))

function PageFallback() {
  return <div className="grid min-h-40 place-items-center text-sm text-muted-foreground">Loading…</div>
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
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
