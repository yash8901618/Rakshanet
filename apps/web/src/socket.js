import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (typeof window !== 'undefined' && window.location.hostname 
    ? `http://${window.location.hostname}:3001` 
    : 'http://localhost:3001');

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000
});

socket.on('connect', () => {
  console.log(`[MESH CLIENT] Connected to Gravity Hub at ${BACKEND_URL} as socket ID: ${socket.id}`);
});

socket.on('connect_error', (err) => {
  console.warn(`[MESH CLIENT] Connection error to Gravity Hub:`, err.message);
});

socket.on('disconnect', (reason) => {
  console.log(`[MESH CLIENT] Disconnected from Gravity Hub:`, reason);
});
