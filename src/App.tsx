import { Route, Routes } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>HR Module</CardTitle>
          <CardDescription>
            Employee profiles, attendance and leave management.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Project setup complete. Each feature is built on its own
          <code className="mx-1">frontend/*</code>branch.
        </CardContent>
      </Card>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App
