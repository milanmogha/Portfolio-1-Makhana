import { io } from 'socket.io-client';

// Env-driven everywhere: .env.development points at localhost:5000 in dev,
// production builds get the real socket URL baked in at build time.
const RAW = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://localhost:5000/';

// The socket base may include a path prefix (e.g. https://host/makhana-api when
// deployed under path-based routing). socket.io must connect to the ORIGIN with
// the prefix folded into the engine.io path, otherwise the path is misread as a
// namespace and engine requests hit the wrong URL.
let SOCKET_ORIGIN = RAW;
let SOCKET_PATH = '/socket.io';
try {
	const u = new URL(RAW);
	SOCKET_ORIGIN = u.origin;
	SOCKET_PATH = u.pathname.replace(/\/+$/, '') + '/socket.io';
} catch {
	/* RAW empty/relative → same-origin defaults */
}

const socket = io(SOCKET_ORIGIN, {
	path: SOCKET_PATH,
	transports: ['websocket', 'polling'],
	withCredentials: false,
	reconnection: true,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	reconnectionAttempts: 5
});

socket.on('connect', () => {
	// Connected
});

socket.on('connect_error', (error) => {
	console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
	// Disconnected
});

socket.on('error', (error) => {
	console.error('Socket error:', error);
});

export default socket;