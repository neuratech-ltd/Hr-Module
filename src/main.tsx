import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { HRProvider } from '@/store/hr-store'
import { AuthProvider } from '@/auth/auth'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HRProvider>
      <AuthProvider>
        <BrowserRouter>
          <TooltipProvider>
            <App />
            <Toaster position="top-right" richColors={false} />
          </TooltipProvider>
        </BrowserRouter>
      </AuthProvider>
    </HRProvider>
  </StrictMode>,
)
