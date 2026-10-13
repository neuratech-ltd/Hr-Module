import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/apply-leave branch.
export function ApplyLeavePage() {
  return (
    <>
      <PageHeader title="Apply for leave" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/apply-leave branch." />
        </CardContent>
      </Card>
    </>
  )
}
