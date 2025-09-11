
// socket-server/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { createWordPressIntegration } from "./wordpress-integration.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: (process.env.CORS_METHODS || "GET,POST").split(",")
}));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: (process.env.CORS_METHODS || "GET,POST").split(",")
  },
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || "60000"),
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || "25000")
});

// Initialize WordPress integration
const wpIntegration = createWordPressIntegration();

// Store active connections and their state
const activeConnections = new Map(); // socket.id -> { userId, threadRooms: Set }
const userPresence = new Map(); // userId -> { status, lastSeen, socketIds: Set }
const typingUsers = new Map(); // threadId -> Set of userIds
const tempMessageMap = new Map(); // tempId -> realId for optimistic updates

// Middleware for authentication (you can integrate with WordPress auth)
io.use((socket, next) => {
  // For now, we'll accept any connection
  // In production, verify JWT token or WordPress session
  const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
  if (!userId) {
    return next(new Error("Authentication required"));
  }
  socket.userId = parseInt(userId);
  next();
});

io.on("connection", (socket) => {
  console.log(`🔗 User connected: ${socket.id}, User ID: ${socket.userId}`);

  // Initialize user connection
  initializeUserConnection(socket);

  // ==========================================
  // CLIENT -> SERVER EVENTS
  // ==========================================

  /**
   * Join a thread room
   * Event: join_thread
   * Payload: { threadId }
   */
  socket.on("join_thread", async ({ threadId }) => {
    try {
      console.log(`� User ${socket.userId} joining thread ${threadId}`);
      
      // Validate thread access (integrate with your REST API)
      const canAccess = await validateThreadAccess(socket.userId, threadId);
      if (!canAccess) {
        socket.emit("error", { 
          event: "join_thread", 
          message: "Access denied to this thread" 
        });
        return;
      }

      // Join the room
      await socket.join(`thread_${threadId}`);
      
      // Track user's thread rooms
      const connection = activeConnections.get(socket.id);
      if (connection) {
        connection.threadRooms.add(threadId);
      }

      // Notify others about presence
      socket.to(`thread_${threadId}`).emit("presence", {
        threadId,
        userId: socket.userId,
        status: "online"
      });

      socket.emit("thread_joined", { threadId });
      console.log(`✅ User ${socket.userId} joined thread ${threadId}`);

    } catch (error) {
      console.error("Error joining thread:", error);
      socket.emit("error", { 
        event: "join_thread", 
        message: "Failed to join thread" 
      });
    }
  });

  /**
   * Leave a thread room
   * Event: leave_thread
   * Payload: { threadId }
   */
  socket.on("leave_thread", ({ threadId }) => {
    console.log(`👋 User ${socket.userId} leaving thread ${threadId}`);
    
    socket.leave(`thread_${threadId}`);
    
    // Remove from tracked rooms
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.threadRooms.delete(threadId);
    }

    // Clear typing status
    clearTypingStatus(socket.userId, threadId);

    // Notify others about presence change
    socket.to(`thread_${threadId}`).emit("presence", {
      threadId,
      userId: socket.userId,
      status: "offline"
    });

    socket.emit("thread_left", { threadId });
  });

  /**
   * Send a message (optimistic update support)
   * Event: message_send
   * Payload: { threadId, tempId, content, contentType, attachments }
   */
  socket.on("message_send", async (data) => {
    const { threadId, tempId, content, contentType = "text/plain", attachments = [] } = data;
    
    try {
      console.log(`💬 Message from user ${socket.userId} in thread ${threadId}`);

      // Validate thread access
      const canAccess = await validateThreadAccess(socket.userId, threadId);
      if (!canAccess) {
        socket.emit("error", { 
          event: "message_send", 
          message: "Access denied to this thread" 
        });
        return;
      }

      // Store message to database (integrate with your REST API)
      const messageData = await storeMessage({
        threadId,
        senderId: socket.userId,
        content,
        contentType,
        attachments
      });

      // Map temp ID to real ID for optimistic updates
      if (tempId) {
        tempMessageMap.set(tempId, messageData.id);
        
        // Send mapping back to sender
        socket.emit("message_id_mapping", {
          tempId,
          realId: messageData.id
        });
      }

      // Clear typing status for this user
      clearTypingStatus(socket.userId, threadId);

      // Broadcast message to all thread members
      io.to(`thread_${threadId}`).emit("message", {
        id: messageData.id,
        threadId,
        senderId: socket.userId,
        senderName: messageData.senderName,
        content,
        contentType,
        attachments,
        status: "sent",
        createdAt: messageData.createdAt,
        updatedAt: messageData.updatedAt
      });

      console.log(`✅ Message ${messageData.id} sent to thread ${threadId}`);

    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { 
        event: "message_send", 
        message: "Failed to send message",
        tempId 
      });
    }
  });

  /**
   * Typing indicator
   * Event: typing
   * Payload: { threadId, isTyping }
   */
  socket.on("typing", ({ threadId, isTyping }) => {
    console.log(`⌨️ User ${socket.userId} typing in thread ${threadId}: ${isTyping}`);

    if (isTyping) {
      // Add user to typing list
      if (!typingUsers.has(threadId)) {
        typingUsers.set(threadId, new Set());
      }
      typingUsers.get(threadId).add(socket.userId);
      
      // Set timeout to clear typing status
      setTimeout(() => {
        clearTypingStatus(socket.userId, threadId);
      }, 10000); // Clear after 10 seconds

    } else {
      // Remove user from typing list
      clearTypingStatus(socket.userId, threadId);
    }

    // Broadcast typing status to others in the thread
    socket.to(`thread_${threadId}`).emit("typing", {
      threadId,
      userId: socket.userId,
      isTyping
    });
  });

  /**
   * Mark messages as read
   * Event: message_read
   * Payload: { threadId, messageIds }
   */
  socket.on("message_read", async ({ threadId, messageIds }) => {
    try {
      console.log(`👁️ User ${socket.userId} read messages in thread ${threadId}:`, messageIds);

      // Store read receipts (integrate with your REST API)
      const readAt = new Date().toISOString();
      await markMessagesAsRead(socket.userId, threadId, messageIds);

      // Broadcast read receipts to thread members
      messageIds.forEach(messageId => {
        socket.to(`thread_${threadId}`).emit("read_receipt", {
          messageId,
          userId: socket.userId,
          readAt
        });
      });

    } catch (error) {
      console.error("Error marking messages as read:", error);
      socket.emit("error", { 
        event: "message_read", 
        message: "Failed to mark messages as read" 
      });
    }
  });

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  /**
   * Handle disconnection
   */
  socket.on("disconnect", (reason) => {
    console.log(`❌ User ${socket.userId} disconnected: ${reason}`);
    
    handleUserDisconnection(socket);
  });

  /**
   * Handle connection errors
   */
  socket.on("error", (error) => {
    console.error(`🔥 Socket error for user ${socket.userId}:`, error);
  });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Initialize user connection state
 */
function initializeUserConnection(socket) {
  // Track connection
  activeConnections.set(socket.id, {
    userId: socket.userId,
    threadRooms: new Set(),
    connectedAt: new Date()
  });

  // Update user presence
  if (!userPresence.has(socket.userId)) {
    userPresence.set(socket.userId, {
      status: "online",
      lastSeen: new Date(),
      socketIds: new Set()
    });
  }
  userPresence.get(socket.userId).socketIds.add(socket.id);
  userPresence.get(socket.userId).status = "online";
}

/**
 * Handle user disconnection cleanup
 */
function handleUserDisconnection(socket) {
  const connection = activeConnections.get(socket.id);
  if (!connection) return;

  // Clear typing status for all threads
  connection.threadRooms.forEach(threadId => {
    clearTypingStatus(socket.userId, threadId);
    
    // Notify thread about presence change
    socket.to(`thread_${threadId}`).emit("presence", {
      threadId,
      userId: socket.userId,
      status: "offline"
    });
  });

  // Update user presence
  const presence = userPresence.get(socket.userId);
  if (presence) {
    presence.socketIds.delete(socket.id);
    presence.lastSeen = new Date();
    
    // If no more connections, mark as offline
    if (presence.socketIds.size === 0) {
      presence.status = "offline";
    }
  }

  // Remove connection
  activeConnections.delete(socket.id);
}

/**
 * Clear typing status for a user in a thread
 */
function clearTypingStatus(userId, threadId) {
  if (typingUsers.has(threadId)) {
    const wasTyping = typingUsers.get(threadId).has(userId);
    typingUsers.get(threadId).delete(userId);
    
    if (typingUsers.get(threadId).size === 0) {
      typingUsers.delete(threadId);
    }

    if (wasTyping) {
      // Notify thread that user stopped typing
      io.to(`thread_${threadId}`).emit("typing", {
        threadId,
        userId,
        isTyping: false
      });
    }
  }
}

// ==========================================
// DATABASE INTEGRATION FUNCTIONS
// ==========================================
// These functions should integrate with your WordPress REST API

/**
 * Validate if user can access a thread
 */
async function validateThreadAccess(userId, threadId) {
  try {
    return await wpIntegration.validateThreadAccess(userId, threadId);
  } catch (error) {
    console.error("Error validating thread access:", error);
    return false;
  }
}

/**
 * Store message to database
 */
async function storeMessage(messageData) {
  try {
    return await wpIntegration.storeMessage(messageData);
  } catch (error) {
    console.error("Error storing message:", error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
async function markMessagesAsRead(userId, threadId, messageIds) {
  try {
    return await wpIntegration.markMessagesAsRead(userId, threadId, messageIds);
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}

// ==========================================
// SERVER ADMIN ENDPOINTS
// ==========================================

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    connections: activeConnections.size,
    activeUsers: userPresence.size
  });
});

/**
 * Get server stats
 */
app.get("/stats", (req, res) => {
  const stats = {
    connections: {
      total: activeConnections.size,
      details: Array.from(activeConnections.entries()).map(([socketId, data]) => ({
        socketId,
        userId: data.userId,
        threadRooms: Array.from(data.threadRooms),
        connectedAt: data.connectedAt
      }))
    },
    presence: {
      totalUsers: userPresence.size,
      onlineUsers: Array.from(userPresence.entries())
        .filter(([_, data]) => data.status === "online").length,
      details: Array.from(userPresence.entries()).map(([userId, data]) => ({
        userId,
        status: data.status,
        lastSeen: data.lastSeen,
        activeConnections: data.socketIds.size
      }))
    },
    typing: {
      activeThreads: typingUsers.size,
      details: Array.from(typingUsers.entries()).map(([threadId, users]) => ({
        threadId,
        typingUsers: Array.from(users)
      }))
    }
  };
  
  res.json(stats);
});

// ==========================================
// SERVER STARTUP
// ==========================================

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats endpoint: http://localhost:${PORT}/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default server;
