import { io } from 'socket.io-client';

// Connect to Gravity Hub backend running on port 3001
const SOCKET_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  autoConnect: true
});
