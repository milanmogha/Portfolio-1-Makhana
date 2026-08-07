// backend/socket.js
import { Server } from "socket.io";

let io;

const allowedOrigins = [
  "https://makhanahealthking.com",
  "https://www.makhanahealthking.com",
  "https://admin.makhanahealthking.com"
];

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
    
    // Listen for client type identification
    socket.on('identify', (data) => {
      if (data.type === 'admin') {
        socket.join('admin-room');
        console.log(`📢 Socket ${socket.id} joined admin-room`);
      } else if (data.type === 'customer') {
        console.log(`👤 Customer socket ${socket.id} connected`);
      }
    });
    
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
