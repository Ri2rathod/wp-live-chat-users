# WordPress Live Chat - Troubleshooting Guide

## Current Issues Fixed ✅

### 1. Socket.IO Client Library 
- **Problem**: `io is not defined` error
- **Solution**: Installed `socket.io-client` package
- **Status**: ✅ Fixed - Library installed and imported correctly

### 2. Build Process
- **Problem**: Missing Socket.IO in bundle
- **Solution**: Rebuilt project with new dependency
- **Status**: ✅ Fixed - Bundle now includes Socket.IO (371KB vs 330KB)

## Remaining Issues 🔧

### 3. WordPress Authentication (403 Forbidden)
- **Problem**: API requests failing with 403 Forbidden
- **Possible Causes**:
  1. User not logged into WordPress
  2. WordPress nonce not being generated correctly
  3. REST API permissions not set correctly
  4. Plugin not activated

### 4. Next Steps to Debug

#### A. Check WordPress User Login
1. Make sure you're logged into WordPress admin
2. Navigate to the page with the `[chatpulse-chat]` shortcode
3. Check browser console for `wpApiSettings` and `chatpulseChatSettings`

#### B. Verify Plugin Activation
1. Go to WordPress Admin > Plugins
2. Ensure "Chatpulse" is activated
3. Check for any activation errors

#### C. Test API Endpoints Manually
```bash
# Test if WordPress REST API is working
curl -X GET "http://localhost/wp/chatpulse/wp-json/wp/v2/users/me" \
  -H "X-WP-Nonce: [NONCE_VALUE]" \
  --cookie "wordpress_logged_in_[HASH]=[COOKIE_VALUE]"

# Test chat API endpoint
curl -X GET "http://localhost/wp/chatpulse/wp-json/chatpulse-chat/v1/threads" \
  -H "X-WP-Nonce: [NONCE_VALUE]" \
  --cookie "wordpress_logged_in_[HASH]=[COOKIE_VALUE]"
```

#### D. Check Database Tables
```sql
-- Check if chat tables exist
SHOW TABLES LIKE 'wp_chatpulse_%';

-- Check migration status
SELECT * FROM wp_chatpulse_migrations;
```

#### E. Run Database Migrations
```bash
# If tables don't exist, run migrations
wp chatpulse migrate --up
```

## Quick Debug JavaScript

Add this to browser console to check WordPress settings:

```javascript
// Check if WordPress settings are loaded
console.log('wpApiSettings:', window.wpApiSettings);
console.log('chatpulseChatSettings:', window.chatpulseChatSettings);

// Check current user
if (window.wpApiSettings?.currentUser) {
  console.log('WordPress user found:', window.wpApiSettings.currentUser);
} else {
  console.log('No WordPress user found - user may not be logged in');
}

// Test nonce
if (window.wpApiSettings?.nonce) {
  console.log('WordPress nonce available:', window.wpApiSettings.nonce);
} else {
  console.log('No WordPress nonce - authentication may fail');
}
```

## Expected Console Output (When Working)

```javascript
// Good output:
wpApiSettings: {
  root: "http://localhost/wp/chatpulse/wp-json/",
  nonce: "abc123def456",
  currentUser: {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    avatar: "...",
    capabilities: {...}
  }
}

chatpulseChatSettings: {
  socketUrl: "http://localhost:3001",
  apiNamespace: "chatpulse-chat/v1",
  currentUser: {...},
  settings: {...}
}
```

## If Still Having Issues

1. **Check WordPress Error Logs**: Look in `/wp-content/debug.log`
2. **Enable WP Debug**: Add to `wp-config.php`:
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   ```
3. **Check Plugin Logs**: Look for any PHP errors during plugin activation
4. **Verify Database**: Ensure tables were created successfully
5. **Check Permissions**: Verify file permissions are correct

The main issue now is likely WordPress authentication - make sure you're logged in and the plugin is properly activated!
