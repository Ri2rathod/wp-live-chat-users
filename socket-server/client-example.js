// socket-server/client-example.js
// Example client implementation for the chat WebSocket events

class ChatSocketClient {
  constructor(serverUrl, userId, options = {}) {
    this.serverUrl = serverUrl;
    this.userId = userId;
    this.socket = null;
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      ...options
    };
    
    // Message optimistic updates
    this.pendingMessages = new Map(); // tempId -> message data
    this.tempIdCounter = 0;
    
    // Event callbacks
    this.eventHandlers = new Map();
    
    this.connect();
  }

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  connect() {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Import socket.io-client in your actual implementation
    // import { io } from 'socket.io-client';
    
    this.socket = io(this.serverUrl, {
      auth: {
        userId: this.userId
      },
      autoConnect: true
    });

    this.setupEventListeners();
    console.log(`🔗 Connecting to ${this.serverUrl} as user ${this.userId}`);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  // ==========================================
  // EVENT HANDLING
  // ==========================================

  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('error', (error) => {
      console.error('🔥 Socket error:', error);
      this.emit('error', error);
    });

    // Chat events
    this.socket.on('message', (message) => {
      console.log('📨 New message:', message);
      this.emit('message', message);
    });

    this.socket.on('message_update', (message) => {
      console.log('📝 Message updated:', message);
      this.emit('messageUpdate', message);
    });

    this.socket.on('message_id_mapping', ({ tempId, realId }) => {
      console.log(`🔄 Message ID mapping: ${tempId} -> ${realId}`);
      
      // Update pending message with real ID
      if (this.pendingMessages.has(tempId)) {
        const messageData = this.pendingMessages.get(tempId);
        messageData.id = realId;
        this.pendingMessages.delete(tempId);
        
        this.emit('messageConfirmed', { tempId, realId, message: messageData });
      }
    });

    // Typing events
    this.socket.on('typing', ({ threadId, userId, isTyping }) => {
      console.log(`⌨️ User ${userId} ${isTyping ? 'started' : 'stopped'} typing in thread ${threadId}`);
      this.emit('typing', { threadId, userId, isTyping });
    });

    // Presence events
    this.socket.on('presence', ({ threadId, userId, status }) => {
      console.log(`👤 User ${userId} is ${status} in thread ${threadId}`);
      this.emit('presence', { threadId, userId, status });
    });

    // Read receipts
    this.socket.on('read_receipt', ({ messageId, userId, readAt }) => {
      console.log(`👁️ User ${userId} read message ${messageId} at ${readAt}`);
      this.emit('readReceipt', { messageId, userId, readAt });
    });

    // Thread events
    this.socket.on('thread_joined', ({ threadId }) => {
      console.log(`✅ Joined thread ${threadId}`);
      this.emit('threadJoined', threadId);
    });

    this.socket.on('thread_left', ({ threadId }) => {
      console.log(`👋 Left thread ${threadId}`);
      this.emit('threadLeft', threadId);
    });
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // ==========================================
  // CHAT ACTIONS
  // ==========================================

  /**
   * Join a thread room
   */
  joinThread(threadId) {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }
    
    console.log(`👥 Joining thread ${threadId}`);
    this.socket.emit('join_thread', { threadId });
  }

  /**
   * Leave a thread room
   */
  leaveThread(threadId) {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }
    
    console.log(`👋 Leaving thread ${threadId}`);
    this.socket.emit('leave_thread', { threadId });
  }

  /**
   * Send a message with optimistic updates
   */
  sendMessage(threadId, content, options = {}) {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    const {
      contentType = 'text/plain',
      attachments = [],
      optimistic = true
    } = options;

    // Generate temporary ID for optimistic updates
    const tempId = optimistic ? `temp_${this.userId}_${++this.tempIdCounter}` : null;
    
    const messageData = {
      threadId,
      content,
      contentType,
      attachments,
      tempId,
      senderId: this.userId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Store for optimistic updates
    if (tempId) {
      this.pendingMessages.set(tempId, messageData);
      
      // Emit optimistic message for immediate UI update
      this.emit('message', { ...messageData, id: tempId });
    }

    console.log(`💬 Sending message to thread ${threadId}:`, content);
    this.socket.emit('message_send', {
      threadId,
      tempId,
      content,
      contentType,
      attachments
    });

    return tempId;
  }

  /**
   * Send typing indicator
   */
  setTyping(threadId, isTyping) {
    if (!this.isConnected()) {
      return;
    }

    console.log(`⌨️ Setting typing status for thread ${threadId}: ${isTyping}`);
    this.socket.emit('typing', { threadId, isTyping });
  }

  /**
   * Mark messages as read
   */
  markMessagesRead(threadId, messageIds) {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    console.log(`👁️ Marking messages as read in thread ${threadId}:`, messageIds);
    this.socket.emit('message_read', { threadId, messageIds });
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get pending messages for a thread
   */
  getPendingMessages(threadId) {
    return Array.from(this.pendingMessages.values())
      .filter(msg => msg.threadId === threadId);
  }

  /**
   * Clear pending message (e.g., on error)
   */
  clearPendingMessage(tempId) {
    this.pendingMessages.delete(tempId);
    this.emit('messageFailed', { tempId });
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connected: this.isConnected(),
      userId: this.userId,
      pendingMessages: this.pendingMessages.size,
      eventHandlers: Array.from(this.eventHandlers.keys())
    };
  }
}

// ==========================================
// USAGE EXAMPLE
// ==========================================

/*
// Initialize client
const chatClient = new ChatSocketClient('http://localhost:3001', 123);

// Set up event handlers
chatClient.on('connected', () => {
  console.log('Chat client connected!');
  
  // Join a thread
  chatClient.joinThread(456);
});

chatClient.on('message', (message) => {
  console.log('New message received:', message);
  // Update your UI with the new message
});

chatClient.on('typing', ({ threadId, userId, isTyping }) => {
  console.log(`User ${userId} is ${isTyping ? '' : 'not '}typing in thread ${threadId}`);
  // Update typing indicators in UI
});

chatClient.on('presence', ({ threadId, userId, status }) => {
  console.log(`User ${userId} is ${status} in thread ${threadId}`);
  // Update user presence indicators
});

chatClient.on('readReceipt', ({ messageId, userId, readAt }) => {
  console.log(`Message ${messageId} was read by user ${userId}`);
  // Update read receipt indicators
});

// Send a message
const tempId = chatClient.sendMessage(456, 'Hello world!');

// Handle typing
let typingTimeout;
const handleTyping = () => {
  chatClient.setTyping(456, true);
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    chatClient.setTyping(456, false);
  }, 1000);
};

// Mark messages as read
chatClient.markMessagesRead(456, [789, 790, 791]);
*/

export default ChatSocketClient;
