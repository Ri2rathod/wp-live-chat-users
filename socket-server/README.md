# WebSocket (Socket.IO) Implementation

## Overview
This WebSocket server implements real-time communication for the Chatpulse plugin using Socket.IO. It provides real-time messaging, typing indicators, presence management, and read receipts.

## Architecture

### Core Components
1. **Server (`server.js`)** - Main Socket.IO server with event handling
2. **WordPress Integration (`wordpress-integration.js`)** - REST API integration layer
3. **Client Example (`client-example.js`)** - Client-side implementation example

### Data Flow
```
Client ↔ Socket.IO Server ↔ WordPress REST API ↔ Database
```

## Events Implementation

### Client → Server Events

#### `connect`
- **Purpose**: Establish connection and authenticate user
- **Authentication**: Requires `userId` in handshake auth or query
- **Response**: Connection established or authentication error

#### `join_thread { threadId }`
- **Purpose**: Join a thread room for real-time updates
- **Validation**: Checks thread access via WordPress REST API
- **Response**: `thread_joined` or `error`
- **Side Effects**: Updates presence status for other users

#### `leave_thread { threadId }`
- **Purpose**: Leave a thread room
- **Side Effects**: 
  - Clears typing status
  - Updates presence status
  - Removes from room

#### `message_send { threadId, tempId, content, attachments }`
- **Purpose**: Send message with optimistic update support
- **Process**:
  1. Validates thread access
  2. Stores message via WordPress REST API
  3. Maps temp ID to real ID
  4. Broadcasts to thread members
- **Optimistic Updates**: Supports temporary IDs for immediate UI updates

#### `typing { threadId, isTyping }`
- **Purpose**: Send typing indicator
- **Behavior**: 
  - Auto-clears after 10 seconds
  - Broadcasts to other thread members
  - Doesn't send to message sender

#### `message_read { threadId, messageIds[] }`
- **Purpose**: Mark messages as read
- **Process**:
  1. Stores read receipts via WordPress REST API
  2. Broadcasts read receipts to thread members

### Server → Client Events

#### `message { message }`
- **Purpose**: New message received
- **Data**: Complete message object with server ID and timestamp
- **Triggers**: When any user sends a message to the thread

#### `message_update { message }`
- **Purpose**: Message edited or status changed
- **Use Cases**: Edit messages, delivery status updates

#### `message_id_mapping { tempId, realId }`
- **Purpose**: Map optimistic update temp ID to real message ID
- **Client Action**: Update local message with real ID

#### `typing { threadId, userId, isTyping }`
- **Purpose**: User typing status change
- **Data**: Which user is typing in which thread

#### `presence { threadId, userId, status }`
- **Purpose**: User presence update
- **Statuses**: `online`, `offline`
- **Triggers**: User joins/leaves thread, connects/disconnects

#### `read_receipt { messageId, userId, readAt }`
- **Purpose**: Message read confirmation
- **Data**: Who read which message and when

#### `thread_joined { threadId }`
- **Purpose**: Confirmation of successful thread join

#### `thread_left { threadId }`
- **Purpose**: Confirmation of thread leave

#### `error { event, message, tempId? }`
- **Purpose**: Error notifications
- **Context**: Includes original event that caused error

## Installation & Setup

### 1. Install Dependencies
```bash
bun install
# or
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your WordPress URL and settings
```

### 3. Start Server
```bash
# Development (with auto-reload)
bun run dev
# or
npm run dev

# Production
bun run start
# or
npm start
```

### 4. Health Check
- Server: `http://localhost:3001/health`
- Stats: `http://localhost:3001/stats`

## Configuration

### Environment Variables
```bash
# WordPress Integration
WP_BASE_URL=http://localhost/wp-json
WP_API_NAMESPACE=chatpulse-chat/v1
WP_API_KEY=your-api-key

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=*
CORS_METHODS=GET,POST
```

## Usage Examples

### Client Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { userId: 123 }
});

// Join a thread
socket.emit('join_thread', { threadId: 456 });

// Send a message
socket.emit('message_send', {
  threadId: 456,
  tempId: 'temp_123_1',
  content: 'Hello world!',
  contentType: 'text/plain'
});

// Listen for messages
socket.on('message', (message) => {
  console.log('New message:', message);
});
```

This project was created using `bun init` and enhanced with comprehensive WebSocket functionality for real-time chat.
