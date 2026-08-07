import { io } from 'socket.io-client';

const RAW = import.meta.env.VITE_API_URL || 'https://localhost:5000';

// VITE_API_URL may include a path prefix (e.g. https://host/makhana-api under
// path-based routing). Connect to the ORIGIN with the prefix folded into the
// engine.io path so the socket routes correctly and uses the default namespace.
let SOCKET_ORIGIN = RAW;
let SOCKET_PATH = '/socket.io';
try {
  const u = new URL(RAW);
  SOCKET_ORIGIN = u.origin;
  SOCKET_PATH = u.pathname.replace(/\/+$/, '') + '/socket.io';
} catch {
  /* RAW relative → same-origin defaults */
}

const socket = io(SOCKET_ORIGIN, {
  path: SOCKET_PATH,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

socket.on('connect', () => {
  socket.emit('identify', { type: 'admin' });
});

socket.on('disconnect', (reason) => {
  // Socket disconnected
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error.message);
});

socket.on('reconnect', (attemptNumber) => {
  // Socket reconnected
});

socket.on('new-notification', (notification) => {
  // New notification received
});

socket.on('order-placed', (order) => {
  // Order placed event
});

socket.on('order-updated', (order) => {
  // Order updated event
});

export default socket;
