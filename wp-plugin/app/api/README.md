# REST API Structure Documentation

## Overview
The WordPress Live Chat Users REST API has been separated into two main files for better organization and maintainability:

## File Structure

### 1. `ChatpulseRestApiRoutes.php` - Route Registration
**Purpose**: Handles all REST API route registration and validation rules.

**Features**:
- Clean separation of route definitions
- Organized route groups (threads, messages, attachments, typing, read receipts)
- Centralized validation and sanitization rules
- Easy to maintain and extend

**Route Groups**:
- **Threads Routes**: `/threads` - GET/POST endpoints for thread management
- **Messages Routes**: `/threads/{id}/messages` - GET/POST for thread messages
- **Attachments Routes**: `/attachments` - POST for file uploads
- **Typing Routes**: `/threads/{id}/typing` - GET/POST for typing indicators
- **Read Receipts Routes**: `/threads/{id}/read` and `/messages/{id}/receipts` - Read status management

### 2. `ChatpulseRestApiController.php` - Controller Callbacks
**Purpose**: Contains all the callback functions that handle the actual API logic.

**Features**:
- Business logic for each endpoint
- Database operations
- Security checks and validation
- Response formatting
- Rate limiting
- Error handling

**Key Methods**:
- `get_threads()` - Retrieve user's message threads
- `create_thread()` - Create new message thread
- `get_thread_messages()` - Get messages from a thread
- `send_message()` - Send new message to thread
- `upload_attachment()` - Handle file uploads
- `handle_typing_indicator()` - Manage typing status
- `mark_messages_read()` - Mark messages as read
- `get_message_read_receipts()` - Get read receipts for message

## API Endpoints

### Base URL: `wp-json/chatpulse-chat/v1/`

#### Threads
- `GET /threads` - Get user's threads with pagination and search
- `POST /threads` - Create new thread (private or group)

#### Messages
- `GET /threads/{id}/messages` - Get messages from thread
- `POST /threads/{id}/messages` - Send message to thread

#### Attachments
- `POST /attachments` - Upload file attachment

#### Typing Indicators
- `GET /threads/{id}/typing` - Get current typing users
- `POST /threads/{id}/typing` - Update typing status

#### Read Receipts
- `POST /threads/{id}/read` - Mark messages as read
- `GET /messages/{id}/receipts` - Get read receipts for message

## Security Features

### Authentication & Authorization
- User login requirement
- Capability checks (`read` permission minimum)
- Thread access permissions
- Custom permission filters

### Rate Limiting
- Messages: 60 per minute
- Uploads: 10 per minute  
- Typing updates: 30 per minute

### Input Validation
- Parameter validation for all endpoints
- Content sanitization (wp_kses_post)
- File upload validation (type, size limits)
- SQL injection prevention

### Security Headers
- Proper HTTP status codes
- Error message standardization
- Nonce verification for POST requests

## Usage Example

```javascript
// Get threads
fetch('/wp-json/chatpulse-chat/v1/threads?page=1&per_page=10')
  .then(response => response.json())
  .then(data => console.log(data.threads));

// Send message
fetch('/wp-json/chatpulse-chat/v1/threads/123/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': wpApiSettings.nonce
  },
  body: JSON.stringify({
    content: 'Hello world!',
    content_type: 'text/plain'
  })
});
```

## Benefits of Separation

1. **Maintainability**: Routes and logic are clearly separated
2. **Readability**: Easier to find and modify specific functionality
3. **Scalability**: Simple to add new endpoints or modify existing ones
4. **Testing**: Controller methods can be tested independently
5. **Documentation**: Route definitions serve as API documentation
6. **Reusability**: Controller methods can be reused in different contexts

## Integration

The routes are automatically registered when the main controller is initialized:

```php
// In ChatpulseApp.php
ChatpulseRestApiController::instance()->init();

// This automatically calls:
ChatpulseRestApiRoutes::instance()->init();
```

## Future Enhancements

1. **Thread Participants**: Add support for group chat participants table
2. **Message Reactions**: Extend reaction support with database storage
3. **File Management**: Add endpoints for attachment management
4. **Admin Endpoints**: Add admin-specific endpoints for moderation
5. **Webhooks**: Add webhook support for external integrations
