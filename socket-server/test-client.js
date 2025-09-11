// socket-server/test-client.js
// Simple test client to verify WebSocket functionality

import { io } from 'socket.io-client';

class TestClient {
  constructor(userId, serverUrl = 'http://localhost:3001') {
    this.userId = userId;
    this.serverUrl = serverUrl;
    this.socket = null;
  }

  connect() {
    console.log(`🔗 Connecting test client for user ${this.userId}...`);
    
    this.socket = io(this.serverUrl, {
      auth: { userId: this.userId }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log(`✅ Test client ${this.userId} connected`);
      this.runTests();
    });

    this.socket.on('disconnect', () => {
      console.log(`❌ Test client ${this.userId} disconnected`);
    });

    this.socket.on('error', (error) => {
      console.error(`🔥 Error for client ${this.userId}:`, error);
    });

    this.socket.on('thread_joined', (data) => {
      console.log(`📥 Thread joined:`, data);
    });

    this.socket.on('message', (message) => {
      console.log(`📨 Message received by ${this.userId}:`, message);
    });

    this.socket.on('typing', (data) => {
      console.log(`⌨️ Typing indicator:`, data);
    });

    this.socket.on('presence', (data) => {
      console.log(`👤 Presence update:`, data);
    });

    this.socket.on('read_receipt', (data) => {
      console.log(`👁️ Read receipt:`, data);
    });

    this.socket.on('message_id_mapping', (data) => {
      console.log(`🔄 Message ID mapping:`, data);
    });
  }

  async runTests() {
    console.log(`🧪 Running tests for user ${this.userId}...`);

    // Test 1: Join thread
    await this.delay(1000);
    console.log(`Test 1: Joining thread 1`);
    this.socket.emit('join_thread', { threadId: 1 });

    // Test 2: Send typing indicator
    await this.delay(2000);
    console.log(`Test 2: Sending typing indicator`);
    this.socket.emit('typing', { threadId: 1, isTyping: true });

    // Test 3: Send message
    await this.delay(1000);
    console.log(`Test 3: Sending message`);
    this.socket.emit('message_send', {
      threadId: 1,
      tempId: `temp_${this.userId}_${Date.now()}`,
      content: `Hello from test client ${this.userId}!`,
      contentType: 'text/plain'
    });

    // Test 4: Stop typing
    await this.delay(1000);
    console.log(`Test 4: Stopping typing`);
    this.socket.emit('typing', { threadId: 1, isTyping: false });

    // Test 5: Mark message as read (mock message ID)
    await this.delay(2000);
    console.log(`Test 5: Marking messages as read`);
    this.socket.emit('message_read', { 
      threadId: 1, 
      messageIds: [1, 2, 3] 
    });

    // Test 6: Leave thread
    await this.delay(2000);
    console.log(`Test 6: Leaving thread`);
    this.socket.emit('leave_thread', { threadId: 1 });

    // Disconnect after all tests
    await this.delay(2000);
    console.log(`✅ Tests completed for user ${this.userId}`);
    this.socket.disconnect();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests with multiple clients
async function runAllTests() {
  console.log('🚀 Starting WebSocket tests...');

  // Create test clients
  const client1 = new TestClient(101);
  const client2 = new TestClient(102);

  // Connect clients with delay
  client1.connect();
  
  setTimeout(() => {
    client2.connect();
  }, 3000);

  // Keep process alive for tests
  setTimeout(() => {
    console.log('🏁 All tests completed');
    process.exit(0);
  }, 30000);
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export default TestClient;
