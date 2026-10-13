import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/department-designation branch.
export function DepartmentsPage() {
  return (
    <>
      <PageHeader title="Departments & designations" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/department-designation branch." />
        </CardContent>
      </Card>
    </>
  )
}
