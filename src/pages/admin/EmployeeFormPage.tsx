import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/create-profile branch.
export function EmployeeFormPage() {
  return (
    <>
      <PageHeader title="Employee profile" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/create-profile branch." />
        </CardContent>
      </Card>
    </>
  )
}
