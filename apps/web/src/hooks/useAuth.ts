import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'
import { disconnectSocket } from '@/lib/socket'

export function useInitializeAuth() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setInitializing = useAuthStore((s) => s.setInitializing)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        const refresh = await api.post('/auth/refresh', {})
        const payload = refresh.data?.data
        if (!payload?.accessToken || !payload?.user) {
          throw new Error('Missing auth payload')
        }

        setAuth(payload.user, payload.accessToken)
      } catch {
        clearAuth()
      } finally {
        if (mounted) {
          setTimeout(() => setInitializing(false), 800)
        }
      }
    }

    void bootstrap()

    return () => {
      mounted = false
    }
  }, [clearAuth, setAuth, setInitializing])
}

export function useLogout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }

    disconnectSocket()
    clearAuth()
    toast.success('Signed out successfully')
    navigate('/login')
  }
}
