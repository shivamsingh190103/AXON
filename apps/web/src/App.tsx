import { lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useInitializeAuth } from '@/hooks/useAuth'
import { pageTransition } from '@/lib/animations'
import { SplashPage } from '@/pages/SplashPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AuthSuccessPage } from '@/pages/AuthSuccessPage'
import { SharedAnalysisPage } from '@/pages/SharedAnalysisPage'

const AnalysisPage = lazy(() => import('@/pages/AnalysisPage').then((module) => ({ default: module.AnalysisPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export function App() {
  useInitializeAuth()
  const location = useLocation()
  const initializing = useAuthStore((s) => s.initializing)
  const user = useAuthStore((s) => s.user)

  if (initializing) {
    return <SplashPage />
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageTransition} initial="initial" animate="animate" exit="exit">
        <Routes location={location}>
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/auth/success" element={<AuthSuccessPage />} />
          <Route path="/shared/:token" element={<SharedAnalysisPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
