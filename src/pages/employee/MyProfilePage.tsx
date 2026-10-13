import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/my-profile branch.
export function MyProfilePage() {
  return (
    <>
      <PageHeader title="My profile" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/my-profile branch." />
        </CardContent>
      </Card>
    </>
  )
}
