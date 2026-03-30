import type { Server } from 'socket.io'

let ioRef: Server | null = null

export function setIo(io: Server) {
  ioRef = io
}

export function getIo() {
  if (!ioRef) {
    throw new Error('Socket.IO server is not initialized')
  }

  return ioRef
}
