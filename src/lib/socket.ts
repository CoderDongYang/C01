import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

let socket: Socket | null = null;
let lastToken: string | null = null;

export function getSocket(): Socket {
  const token = useAuthStore.getState().accessToken;

  if (!socket || lastToken !== token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    lastToken = token || null;
    socket = io({
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connect error:', err.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastToken = null;
  }
}

export function reconnectSocket() {
  disconnectSocket();
  return getSocket();
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

useAuthStore.subscribe((state, prevState) => {
  if (state.accessToken !== prevState.accessToken) {
    if (state.accessToken) {
      reconnectSocket();
    } else {
      disconnectSocket();
    }
  }
});
