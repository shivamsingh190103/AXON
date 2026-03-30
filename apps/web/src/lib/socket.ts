import { io, type Socket } from 'socket.io-client'

let socketRef: Socket | null = null

export function getSocket(accessToken: string) {
  if (socketRef && socketRef.connected) {
    return socketRef
  }

  socketRef = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001', {
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
