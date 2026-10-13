import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/employee-list branch.
export function EmployeesPage() {
  return (
    <>
      <PageHeader title="Employees" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/employee-list branch." />
        </CardContent>
      </Card>
    </>
  )
}
