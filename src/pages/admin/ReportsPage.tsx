import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/reports branch.
export function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/reports branch." />
        </CardContent>
      </Card>
    </>
  )
}
