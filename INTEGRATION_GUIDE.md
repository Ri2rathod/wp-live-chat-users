# WP Live Chat Users - Complete Integration Guide

## 🚀 Overview

This WordPress plugin provides a complete real-time chat system with:
- **REST API** for data persistence
- **Socket.IO Server** for real-time communication
- **React Frontend** for modern chat UI
- **WordPress Integration** for seamless user management

## 📋 Components

### 1. WordPress Plugin (`/wp-plugin/`)
- Custom database tables for chat threads and messages
- REST API endpoints for CRUD operations
- Admin interface for migrations and settings
- React frontend with TypeScript and Tailwind CSS
- WordPress integration for user authentication

### 2. Socket.IO Server (`/socket-server/`)
- Real-time WebSocket communication
- Event handling for messages, typing, presence
- REST API integration for data persistence
- Health monitoring endpoint

## 🛠️ Installation

### Step 1: Install WordPress Plugin

1. Copy the `wp-plugin` folder to your WordPress plugins directory
2. Activate the plugin in WordPress admin
3. Run database migrations:
   ```bash
   wp wplc migrate --up
   ```

### Step 2: Install Socket.IO Server

1. Navigate to the socket-server directory:
   ```bash
   cd socket-server
   npm install
   ```

2. Configure environment (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. Start the server:
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

### Step 3: Configure WordPress Settings

1. Go to **Settings > Live Chat** in WordPress admin
2. Set the Socket Server URL (default: `http://localhost:3001`)
3. Configure chat features (typing indicators, read receipts, etc.)

## 🎯 Usage

### Adding Chat to Pages

Use the shortcode to add chat to any page or post:

```
[wpcl-chat]
```

### Programmatic Usage

#### REST API Endpoints

```php
// Get chat threads
GET /wp-json/wplc-chat/v1/threads

// Get messages in a thread
GET /wp-json/wplc-chat/v1/threads/{id}/messages

// Send a message
POST /wp-json/wplc-chat/v1/threads/{id}/messages
{
  "content": "Hello world!",
  "content_type": "text/plain"
}

// Create a new thread
POST /wp-json/wplc-chat/v1/threads
{
  "type": "private",
  "title": "Chat with John"
}
```

#### Socket.IO Events

**Client to Server:**
```javascript
// Join a thread
socket.emit('join_thread', { thread_id: 1 });

// Send a message
socket.emit('send_message', {
  thread_id: 1,
  content: 'Hello!',
  content_type: 'text/plain'
});

// Typing indicator
socket.emit('typing_start', { thread_id: 1 });
socket.emit('typing_stop', { thread_id: 1 });

// Mark as read
socket.emit('mark_as_read', { message_id: 123 });
```

**Server to Client:**
```javascript
// New message received
socket.on('message_received', (data) => {
  console.log('New message:', data);
});

// Typing status
socket.on('typing_status', (data) => {
  console.log('User typing:', data);
});

// Read receipt
socket.on('read_receipt', (data) => {
  console.log('Message read:', data);
});

// User presence
socket.on('user_presence', (data) => {
  console.log('User presence:', data);
});
```

## 🔧 Development

### Frontend Development

```bash
cd wp-plugin
npm install
npm run dev    # Development mode
npm run build  # Production build
```

### Socket Server Development

```bash
cd socket-server
npm install
npm run dev    # Development with nodemon
npm start      # Production mode
```

### Database Migrations

```bash
# Run all pending migrations
wp wplc migrate --up

# Rollback last migration
wp wplc migrate --down

# Check migration status
wp wplc migrate --status
```

## 🏗️ Architecture

### Database Schema

**wplc_chat_threads:**
- `id` - Primary key
- `type` - 'private' or 'group'
- `title` - Thread title
- `created_by` - User ID who created
- `created_at` / `updated_at` - Timestamps

**wplc_chat_messages:**
- `id` - Primary key
- `thread_id` - Foreign key to threads
- `sender_id` - User ID of sender
- `content` - Message content
- `content_type` - 'text/plain', 'text/markdown', etc.
- `status` - 'sent', 'delivered', 'read'
- `created_at` / `updated_at` - Timestamps

### Event Flow

1. **User sends message** → React app calls REST API
2. **API saves message** → Returns message with ID
3. **React updates UI** → Shows message as sent
4. **Socket.IO broadcasts** → Other users receive real-time update
5. **Read receipts** → Users mark messages as read
6. **Typing indicators** → Real-time typing status

### Real-time Features

- ✅ **Live messaging** - Instant message delivery
- ✅ **Typing indicators** - See when users are typing
- ✅ **Read receipts** - Know when messages are read
- ✅ **User presence** - Online/offline status
- ✅ **Connection status** - Network connectivity indicator
- ✅ **Optimistic updates** - Immediate UI feedback

## 🔒 Security

### Authentication
- WordPress user authentication
- Nonce verification for REST API
- Socket.IO authentication with user ID

### Permissions
- User capabilities checked (can_chat, can_upload, can_moderate)
- Thread access control
- Message content validation

### Data Validation
- Input sanitization
- XSS protection
- SQL injection prevention
- File upload restrictions

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "connections": 5,
  "activeUsers": 3,
  "timestamp": "2025-09-11T10:30:00Z"
}
```

### WordPress Admin
- Server status checker in Settings > Live Chat
- Migration status in Tools > WP Live Chat
- Real-time connection monitoring

## 🚨 Troubleshooting

### Common Issues

**Chat not loading:**
1. Check if shortcode is present: `[wpcl-chat]`
2. Verify WordPress API settings are localized
3. Check browser console for JavaScript errors

**Socket connection failed:**
1. Ensure Socket.IO server is running
2. Check server URL in WordPress settings
3. Verify CORS configuration

**Messages not sending:**
1. Check WordPress user authentication
2. Verify REST API endpoints are accessible
3. Check database permissions

### Debug Mode

Enable debug logging in WordPress:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Socket.IO server debug:
```bash
DEBUG=socket.io:* npm start
```

## 🔄 Updates

### Plugin Updates
1. Backup database
2. Update plugin files
3. Run migrations: `wp wplc migrate --up`
4. Clear caches

### Server Updates
1. Stop Socket.IO server
2. Update dependencies: `npm update`
3. Restart server
4. Test connections

## 📝 Customization

### Frontend Styling
- Modify `app/resources/assets/globals.css`
- Update Tailwind configuration in `tailwind.config.ts`
- Customize React components in `app/resources/components/`

### API Extensions
- Add new endpoints in `app/api/WPLCRestApiController.php`
- Extend database schema with new migrations
- Add custom Socket.IO events in `socket-server/server.js`

### WordPress Hooks
```php
// Filter socket server URL
add_filter('wplc_socket_server_url', function($url) {
    return 'wss://your-socket-server.com';
});

// Filter chat loading conditions
add_filter('wplc_should_load_chat', function($should_load) {
    // Custom logic
    return $should_load;
});
```

## 📚 API Reference

### REST API Documentation
- [API Endpoints](./docs/api-endpoints.md)
- [Authentication](./docs/authentication.md)
- [Error Codes](./docs/error-codes.md)

### Socket.IO Events
- [Client Events](./docs/socket-client-events.md)
- [Server Events](./docs/socket-server-events.md)
- [Event Data Schemas](./docs/event-schemas.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

GPL-2.0+ - See LICENSE file for details.

## 🆘 Support

- GitHub Issues: [wp-live-chat-users/issues](https://github.com/Ri2rathod/wp-live-chat-users/issues)
- Documentation: [Full Documentation](./docs/)
- Email: [Support Email]

---

**Built with ❤️ for the WordPress community**
