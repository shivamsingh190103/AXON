import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

function isLocalHost(value: string) {
  return value === 'localhost' || value === '127.0.0.1' || value === '::1'
}

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL
  const fallback = 'http://localhost:3001/api/v1'

  if (typeof window === 'undefined') {
    return configured ?? fallback
  }

  const target = configured ?? fallback

  try {
    const url = new URL(target)
    const browserHost = window.location.hostname
    if (isLocalHost(url.hostname) && !isLocalHost(browserHost)) {
      url.hostname = browserHost
      return url.toString().replace(/\/$/, '')
    }
    return url.toString().replace(/\/$/, '')
  } catch {
    return target
  }
}

const apiBaseUrl = resolveApiBaseUrl()
const SAFE_METHODS = new Set(['get', 'head', 'options'])

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000
})

function readCsrfToken() {
  if (typeof document === 'undefined') {
    return undefined
  }

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
    ?.split('=')[1]
}

let csrfBootstrapPromise: Promise<void> | null = null

async function ensureCsrfCookie() {
  if (readCsrfToken()) {
    return
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = axios
      .get(`${apiBaseUrl}/auth/csrf`, {
        withCredentials: true,
        timeout: 8000
      })
      .then(() => undefined)
      .finally(() => {
        csrfBootstrapPromise = null
      })
  }

  await csrfBootstrapPromise
}

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const method = config.method?.toLowerCase()
  const isSafeMethod = !method || SAFE_METHODS.has(method)

  if (!isSafeMethod && !config.url?.endsWith('/auth/csrf')) {
    await ensureCsrfCookie()
  }

  const csrfToken = readCsrfToken()

  if (csrfToken && !isSafeMethod) {
    config.headers['x-csrf-token'] = csrfToken
  }

  return config
})

let refreshingPromise: Promise<string | null> | null = null

async function refreshAccessToken() {
  if (!refreshingPromise) {
    refreshingPromise = api
      .post('/auth/refresh', {})
      .then((response) => {
        const data = response.data?.data
        if (data?.accessToken && data?.user) {
          useAuthStore.getState().setAuth(data.user, data.accessToken)
          return data.accessToken as string
        }

        return null
      })
      .catch(() => {
        useAuthStore.getState().clearAuth()
        return null
      })
      .finally(() => {
        refreshingPromise = null
      })
  }

  return refreshingPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = String(error.config?.url ?? '')
    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'].some((path) => requestUrl.includes(path))

    if (error.response?.status === 401 && !error.config?._retry && !isAuthEndpoint) {
      error.config._retry = true
      const token = await refreshAccessToken()
      if (token) {
        error.config.headers.Authorization = `Bearer ${token}`
        return api(error.config)
      }
    }

    return Promise.reject(error)
  }
)
