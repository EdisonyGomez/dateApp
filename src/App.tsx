// src/App.tsx
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthProvider'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
// import ProfilePage from './pages/Profile'
import EditProfile from './pages/EditProfile'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
          {/* <Route path="/profile" element={<ProfilePage />} /> */}
          <Route path="/edit-profile" element={<EditProfile />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
