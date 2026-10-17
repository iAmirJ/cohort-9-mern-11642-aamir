import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

// We'll create a singleton socket connection
let socket = null;

export const getSocket = () => {
  if (socket) return socket;
  
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
    auth: {
      token
    }
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
