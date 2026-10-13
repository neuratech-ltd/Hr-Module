import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/holiday-calendar branch.
export function HolidaysPage() {
  return (
    <>
      <PageHeader title="Holiday calendar" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/holiday-calendar branch." />
        </CardContent>
      </Card>
    </>
  )
}
