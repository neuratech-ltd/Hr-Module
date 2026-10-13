import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder: the real screen lives on the frontend/attendance-settings branch.
export function AttendanceSettingsPage() {
  return (
    <>
      <PageHeader title="Office settings" />
      <Card>
        <CardContent>
          <EmptyState icon={Construction} title="Coming soon" description="This section is built on the frontend/attendance-settings branch." />
        </CardContent>
      </Card>
    </>
  )
}
