
// socket-server/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // restrict to your WP site later
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  socket.on("chat_message", (msg) => {
    console.log("💬 Message:", msg);
    io.emit("chat_message", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running at http://localhost:${PORT}`);
});
