import { io } from 'socket.io-client';
let socketRef = null;
export function getSocket(accessToken) {
    if (socketRef && socketRef.connected) {
        return socketRef;
    }
    socketRef = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001', {
        transports: ['websocket'],
        auth: {
            token: accessToken
        }
    });
    return socketRef;
}
export function disconnectSocket() {
    socketRef?.disconnect();
    socketRef = null;
}
