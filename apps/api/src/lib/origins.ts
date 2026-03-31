import { env } from './env.js'

function normalizeOrigin(origin: string) {
  try {
    const url = new URL(origin)
    return `${url.protocol}//${url.host}`
  } catch {
    return origin
  }
}

function getDevAliases(origin: string) {
  const aliases = new Set<string>()

  try {
    const url = new URL(origin)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      const altHost = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
      aliases.add(`${url.protocol}//${altHost}${url.port ? `:${url.port}` : ''}`)
      aliases.add(`${url.protocol}//[::1]${url.port ? `:${url.port}` : ''}`)
    }
  } catch {
    // ignore invalid entries
  }

  return aliases
}

const configuredOrigins = [
  env.FRONTEND_URL,
  ...(env.FRONTEND_URLS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [])
]

const normalizedConfiguredOrigins = configuredOrigins.map(normalizeOrigin)

export const allowedFrontendOrigins = Array.from(
  new Set(
    normalizedConfiguredOrigins.flatMap((origin) => [
      origin,
      ...Array.from(getDevAliases(origin))
    ])
  )
)

export function isAllowedOrigin(origin?: string) {
  if (!origin) {
    return true
  }

  const normalized = normalizeOrigin(origin)

  if (allowedFrontendOrigins.includes(normalized)) {
    return true
  }

  if (env.NODE_ENV !== 'development') {
    return false
  }

  try {
    const url = new URL(normalized)
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
      return true
    }

    const octets = host.split('.').map((part) => Number.parseInt(part, 10))
    if (octets.length === 4 && octets.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      const [a, b] = octets
      if (a === 10 || a === 127) {
        return true
      }

      if (a === 172 && b >= 16 && b <= 31) {
        return true
      }

      if (a === 192 && b === 168) {
        return true
      }
    }
  } catch {
    return false
  }

  return false
}
