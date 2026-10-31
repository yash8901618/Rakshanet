import { io } from 'socket.io-client';

// Connect to Gravity Hub backend running on port 3001
const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:3001`;
  }
  return 'http://localhost:3001';
};

export const socket = io(getSocketUrl(), {
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true,
  transports: ['websocket', 'polling']
});

// Helper for socket event emissions with fallback support
export const emitIncidentReport = (reportData) => {
  socket.emit('REPORT_SUBMITTED', reportData);
};

export const emitRescueStep = (floorNumber) => {
  socket.emit('RESCUE_STEP', { floorNumber: Number(floorNumber) });
};

export const emitForceOverride = (overrideData) => {
  socket.emit('FORCE_OVERRIDE_TRIGGER', overrideData);
};

export const emitOfflineBatch = (batch) => {
  socket.emit('sync:offline_batch', { batch });
};

export default socket;
