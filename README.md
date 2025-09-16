# WP Live Chat Users

[![License: GPL-2.0+](https://img.shields.io/badge/License-GPL--2.0+-blue.svg)](https://www.gnu.org/licenses/gpl-2.0.html)
[![WordPress](https://img.shields.io/badge/WordPress-5.6+-blue.svg)](https://wordpress.org/)
[![PHP](https://img.shields.io/badge/PHP-7.4+-777BB4.svg)](https://php.net/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)

A modern, real-time chat system for WordPress that enables user-to-user communication with a self-hosted WebSocket server. Built with React, TypeScript, and Socket.IO for optimal performance and user experience.

## ✨ Features

### 🚀 Real-Time Communication
- **Instant messaging** with WebSocket (Socket.IO) technology
- **Live typing indicators** to show when users are composing messages
- **Connection status** indicators for network reliability
- **Message delivery status** (pending, sent, delivered, read)

### 💬 Chat Management
- **Private messaging** between users
- **Group chat support** (extensible for future features)
- **Thread-based conversations** with persistent history
- **Message search** and conversation filtering
- **Unread message counters** and notifications

### 🎨 Modern UI/UX
- **Responsive design** built with Tailwind CSS
- **React-powered frontend** with TypeScript for type safety
- **Dark/light mode support** (customizable)
- **Accessible interface** following WCAG guidelines
- **Mobile-optimized** chat experience

### 🔐 Security & Authentication
- **WordPress user integration** with existing authentication
- **API key authentication** for secure server communication
- **Permission-based access control** for chat threads
- **Data sanitization** and validation
- **Rate limiting** and abuse prevention

### ⚡ Performance
- **Optimistic UI updates** for instant feedback
- **Efficient database queries** with proper indexing
- **WebSocket fallback** to REST API when needed
- **Message pagination** and lazy loading
- **Minimal resource footprint**

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Socket.IO Server │    │ WordPress Plugin │
│                 │◄──►│                  │◄──►│                 │
│  - TypeScript   │    │  - Node.js       │    │  - PHP Classes  │
│  - Tailwind CSS │    │  - Express       │    │  - REST API     │
│  - Real-time UI │    │  - WebSocket     │    │  - Database     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Components

1. **WordPress Plugin** (`/wp-plugin/`)
   - REST API endpoints for chat operations
   - Database management and migrations
   - User authentication and permissions
   - Admin interface for configuration

2. **Socket.IO Server** (`/socket-server/`)
   - Real-time WebSocket communication
   - Event handling for messages, typing, presence
   - WordPress API integration
   - Connection management

3. **React Frontend** (`/wp-plugin/app/resources/`)
   - Modern chat interface
   - Real-time message handling
   - Optimistic UI updates
   - Connection status management

## 📦 Installation

### Prerequisites

- **WordPress 5.6+** with PHP 7.4+
- **Node.js 16+** with npm or bun
- **MySQL/MariaDB** database
- **Web server** (Apache/Nginx) with WebSocket support

### 1. WordPress Plugin Setup

```bash
# Clone the repository
git clone https://github.com/Ri2rathod/wp-live-chat-users.git
cd wp-live-chat-users

# Install plugin in WordPress
cp -r wp-plugin/ /path/to/wordpress/wp-content/plugins/wp-live-chat-users/

# Install PHP dependencies
cd /path/to/wordpress/wp-content/plugins/wp-live-chat-users/
composer install
```

### 2. Frontend Build

```bash
# Navigate to plugin directory
cd wp-plugin/

# Install dependencies
npm install
# or
bun install

# Build for production
npm run build
# or
bun run build

# For development
npm run dev
# or
bun run dev
```

### 3. Socket.IO Server Setup

```bash
# Navigate to server directory
cd socket-server/

# Install dependencies
npm install
# or
bun install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start server
npm start
# or
bun start

# For development with auto-reload
npm run dev
# or
bun run dev
```

### 4. WordPress Configuration

1. **Activate the plugin** in WordPress admin
2. **Run database migrations** via WP-CLI or admin interface:
   ```bash
   wp wplc migrate:run --path=/path/to/wordpress
   ```
3. **Configure API settings** in WordPress admin:
   - Go to `Settings > WPLC API`
   - Enable API access
   - Generate API key
   - Configure user permissions

### 5. Environment Configuration

Create `/socket-server/.env` file:

```env
# WordPress Integration
WP_BASE_URL=https://yoursite.com
WP_API_NAMESPACE=wplc-chat/v1
WP_API_KEY=your_generated_api_key_here
WP_API_TIMEOUT=10000

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://yoursite.com
CORS_METHODS=GET,POST

# Socket.IO Configuration
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
```

## 🚀 Usage

### For Users

1. **Add the chat interface** to any page/post using the shortcode:
   ```php
   [wpcl-chat]
   ```

2. **Start conversations** by clicking the "New Chat" button

3. **Send messages** in real-time with typing indicators

4. **Manage conversations** from the sidebar

### For Developers

#### REST API Endpoints

```php
// Get user threads
GET /wp-json/wplc-chat/v1/threads

// Create new thread
POST /wp-json/wplc-chat/v1/threads

// Get thread messages
GET /wp-json/wplc-chat/v1/threads/{id}/messages

// Send message
POST /wp-json/wplc-chat/v1/threads/{id}/messages

// Update typing status
POST /wp-json/wplc-chat/v1/threads/{id}/typing

// Mark messages as read
POST /wp-json/wplc-chat/v1/threads/{id}/read
```

#### WebSocket Events

```javascript
// Client to Server
socket.emit('join_thread', { thread_id: 1 });
socket.emit('send_message', { thread_id: 1, content: 'Hello!' });
socket.emit('typing', { thread_id: 1, is_typing: true });

// Server to Client
socket.on('message_received', (message) => { /* handle */ });
socket.on('typing_status', (status) => { /* handle */ });
socket.on('user_joined', (user) => { /* handle */ });
```

#### Hooks and Filters

```php
// Customize user chat permissions
add_filter('wplc_user_can_access_chat', function($can_access, $user, $request) {
    return $user->has_cap('read'); // Customize logic
}, 10, 3);

// Modify thread access
add_filter('wplc_user_can_access_thread', function($can_access, $user_id, $thread_id, $thread) {
    return true; // Customize access logic
}, 10, 4);

// Chat message sent hook
add_action('wplc_message_sent', function($message, $thread, $user) {
    // Custom logic after message sent
}, 10, 3);
```

## 🔧 Development

### Database Schema

The plugin creates these database tables:

- `wp_wplc_message_threads` - Chat thread storage
- `wp_wplc_messages` - Individual messages
- `wp_wplc_thread_participants` - Thread membership (future)
- `wp_wplc_message_reactions` - Message reactions (future)

### CLI Commands

```bash
# Run migrations
wp wplc migrate:run

# Rollback migrations
wp wplc migrate:rollback

# Check migration status
wp wplc migrate:status

# Generate API key
wp wplc api:generate-key

# Test API connection
wp wplc api:test
```

### Development Workflow

```bash
# Start WordPress development
cd wp-plugin/
bun run dev

# Start Socket.IO server development
cd socket-server/
bun run dev

# Watch for changes and auto-reload
# Frontend: Vite HMR enabled
# Backend: Nodemon for server restart
```

## 📊 Performance & Monitoring

### Health Checks

- **WordPress Health**: `GET /wp-json/wplc-chat/v1/health`
- **Socket.IO Health**: `GET http://localhost:3001/health`
- **Server Stats**: `GET http://localhost:3001/stats`

### Monitoring

```javascript
// Connection metrics
const stats = await chatService.getConnectionStats();
console.log('Active connections:', stats.connections);
console.log('Messages per second:', stats.messageRate);
```

## 🔒 Security

### Best Practices

- **API Keys**: Rotate regularly and store securely
- **Rate Limiting**: Implement per-user message limits
- **Input Validation**: All messages are sanitized
- **Permission Checks**: Thread access validated per request
- **CORS Configuration**: Restrict origins in production

### Security Headers

```apache
# Apache .htaccess
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy for WebSocket
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring and alerts

### Docker Deployment (Optional)

```dockerfile
# Example Dockerfile for Socket.IO server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Coding Standards

- **PHP**: WordPress Coding Standards
- **JavaScript/TypeScript**: ESLint + Prettier
- **CSS**: Tailwind CSS utility classes
- **Commits**: Conventional Commits specification

## 📜 License

This project is licensed under the GPL-2.0+ License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WordPress community for the robust platform
- Socket.IO team for real-time communication
- React and TypeScript teams for modern frontend tools
- Tailwind CSS for utility-first styling
- All contributors and users of this plugin

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Ri2rathod/wp-live-chat-users/issues)
- **Documentation**: [Wiki](https://github.com/Ri2rathod/wp-live-chat-users/wiki)
- **Community**: [Discussions](https://github.com/Ri2rathod/wp-live-chat-users/discussions)

---

**Made with ❤️ by [Rathod Ritesh](https://github.com/Ri2rathod)**
