import { io, type Socket } from 'socket.io-client'

let socketRef: Socket | null = null

function isLocalHost(value: string) {
  return value === 'localhost' || value === '127.0.0.1' || value === '::1'
}

function resolveSocketUrl() {
  const configured = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001'

  if (typeof window === 'undefined') {
    return configured
  }

  try {
    const url = new URL(configured)
    const browserHost = window.location.hostname

    if (isLocalHost(url.hostname) && !isLocalHost(browserHost)) {
      url.hostname = browserHost
      return url.toString().replace(/\/$/, '')
    }

    return url.toString().replace(/\/$/, '')
  } catch {
    return configured
  }
}

export function getSocket(accessToken: string) {
  if (socketRef && socketRef.connected) {
    return socketRef
  }

  socketRef = io(resolveSocketUrl(), {
    transports: ['websocket'],
    auth: {
      token: accessToken
    }
  })

  return socketRef
}

export function disconnectSocket() {
  socketRef?.disconnect()
  socketRef = null
}
