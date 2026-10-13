import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/employee-dashboard branch.
export function EmployeeDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/employee-dashboard branch." />
        </CardContent>
      </Card>
    </>
  )
}
