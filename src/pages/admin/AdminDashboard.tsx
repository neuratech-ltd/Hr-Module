import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/admin-dashboard branch.
export function AdminDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/admin-dashboard branch." />
        </CardContent>
      </Card>
    </>
  )
}
