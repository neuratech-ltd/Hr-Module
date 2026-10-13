import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/leave-approval branch.
export function LeaveApprovalsPage() {
  return (
    <>
      <PageHeader title="Leave approvals" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/leave-approval branch." />
        </CardContent>
      </Card>
    </>
  )
}
