# User Presence & Unread Message Counter Features

## Overview
This document describes the implementation of two key features:
1. **User Online/Offline Status** - Real-time presence tracking with modular architecture
2. **Unread Message Counter** - Dynamic badge showing unread messages per thread

## Feature 1: User Presence System

### Architecture

The presence system is built as a **modular service** (`PresenceService.ts`) that integrates with the existing chat infrastructure.

#### Components

1. **PresenceService.ts** (New Module)
   - Standalone, reusable service for tracking user presence
   - Socket.IO integration for real-time updates
   - Activity tracking (mouse, keyboard, scroll)
   - Automatic "away" status after 5 minutes of inactivity
   - Heartbeat mechanism (30-second intervals)
   - Visibility API integration (browser tab focus)

2. **ChatService.ts** (Updated)
   - Integrates PresenceService on initialization
   - Exposes presence helper methods:
     - `getUserPresence(userId)` - Get presence object
     - `isUserOnline(userId)` - Boolean check
     - `getLastSeen(userId)` - Formatted last seen text
     - `requestPresence(userIds)` - Fetch presence for specific users

3. **ChatApp.tsx** (Updated)
   - Displays online indicators in chat list and header
   - Real-time updates via socket events
   - Green dot indicator for online users
   - Last seen text for offline users

4. **server.js** (Updated)
   - Socket event handlers for presence
   - Broadcasts presence updates to all clients
   - Tracks user connections in `userPresence` Map

### User Experience

#### Chat List
- **Online Users**: Green dot indicator on avatar
- **Offline Users**: No indicator, last seen in timestamp area

#### Chat Header
- **Online**: "Online" text with green dot on avatar
- **Away**: "Away" text
- **Offline**: Shows last seen time (e.g., "2h ago", "3d ago")

### Data Flow

```
User Activity → PresenceService → Socket.IO → Server → Broadcast
                     ↓
              ChatApp Updates UI
                     ↓
            Green Dots & Status Text
```

### Presence States

| State | Description | Display |
|-------|-------------|---------|
| `online` | User actively using the app | Green dot + "Online" |
| `away` | Inactive for 5+ minutes or tab hidden | "Away" text |
| `offline` | Disconnected from socket | Last seen time |

### Socket Events

#### Client → Server
- `presence:update` - Send presence status
  ```json
  {
    "user_id": 123,
    "status": "online",
    "last_seen": "2025-10-02T10:30:00Z"
  }
  ```

- `presence:request` - Request presence for users
  ```json
  {
    "user_ids": [123, 456, 789]
  }
  ```

#### Server → Client
- `presence:status` - Single user presence update
  ```json
  {
    "user_id": 123,
    "status": "online",
    "last_seen": "2025-10-02T10:30:00Z"
  }
  ```

- `presence:bulk` - Multiple users' presence
  ```json
  [
    { "user_id": 123, "status": "online", "last_seen": "..." },
    { "user_id": 456, "status": "away", "last_seen": "..." }
  ]
  ```

- `user:disconnect` - User disconnected notification
  ```json
  {
    "user_id": 123
  }
  ```

### Technical Details

#### Heartbeat Mechanism
- Sent every **30 seconds** to maintain online status
- Prevents false offline status from network hiccups
- Automatic on service initialization

#### Activity Tracking
The system tracks these events to detect user activity:
- `mousedown`, `mousemove` - Mouse usage
- `keypress` - Keyboard usage
- `scroll`, `touchstart` - Touch/scroll interaction

**Away Timer**: 5 minutes of inactivity triggers "away" status

#### Visibility API
- Browser tab hidden → Status changes to "away"
- Tab becomes visible → Status changes to "online"
- Resets activity timer on visibility change

#### Last Seen Formatting
```typescript
< 1 minute  → "Just now"
< 60 minutes → "15m ago"
< 24 hours  → "3h ago"
< 7 days    → "2d ago"
≥ 7 days    → "Long time ago"
```

### Code Examples

#### Using PresenceService Directly
```typescript
import { presenceService } from './PresenceService';
import { chatService } from './ChatService';

// Initialize (done automatically in ChatService)
presenceService.initialize(socket, userId, {
  onPresenceChanged: (presence) => {
    console.log('User status:', presence);
  },
  onBulkPresenceUpdate: (presences) => {
    console.log('Bulk update:', presences.size);
  }
});

// Check if user is online
const isOnline = presenceService.isUserOnline(123);

// Get formatted last seen
const lastSeen = presenceService.getLastSeenFormatted(123);

// Get full presence object
const presence = presenceService.getUserPresence(123);
```

#### Using via ChatService (Recommended)
```typescript
import { chatService } from './ChatService';

// Check online status
const isOnline = chatService.isUserOnline(123);

// Get last seen text
const lastSeen = chatService.getLastSeen(123);

// Request presence for multiple users
chatService.requestPresence([123, 456, 789]);
```

## Feature 2: Unread Message Counter

### Overview
Display unread message count badge on each thread in the chat list.

### Implementation

#### Data Source
- **Initial Load**: `thread.unread_count` from REST API
- **Real-time Updates**: Calculated on the fly based on:
  - Message received from another user
  - Current active chat (don't count if viewing)
  - Messages marked as read

#### UI Display
- Blue badge with white text
- Shows number of unread messages
- Positioned on right side of chat item
- Only visible when `unread > 0`

#### Update Logic

**Increment Unread**:
```typescript
// When message received
if (message.sender_id !== currentUserId && activeChat !== message.thread_id) {
  chat.unread += 1;
}
```

**Reset Unread**:
```typescript
// When chat is opened
handleChatClick(chatId) {
  setActiveChat(chatId);
  setChatList(prev => prev.map(chat => 
    chat.id === chatId ? { ...chat, unread: 0 } : chat
  ));
}
```

#### Visual Example
```
┌─────────────────────────────────┐
│ 🟢 John Doe                  2m │
│    Hey, are you there?       [3]│  ← Unread badge
├─────────────────────────────────┤
│ 🟢 Alice Smith               5m │
│    Thanks for your help!        │  ← No badge (all read)
└─────────────────────────────────┘
```

### Data Flow

```
1. Load threads from API
   ↓
2. Extract unread_count from each thread
   ↓
3. Display badge if unread > 0
   ↓
4. New message received → Check if should increment
   ↓
5. User clicks chat → Reset unread to 0
   ↓
6. Messages marked as read → Server updates count
```

### ChatItem Interface
```typescript
interface ChatItem {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;  // ← Unread count
  avatar: string | null;
  isBot: boolean;
  type: 'private' | 'group';
  participantIds?: number[];  // For presence tracking
  isOnline?: boolean;  // Online status
  lastSeen?: string;  // Last seen text
}
```

## Testing Scenarios

### Presence Testing
1. **Single User**
   - Open chat app → Status should be "Online"
   - Leave tab for 5+ minutes → Should become "Away"
   - Close browser → Should show as "Offline"

2. **Multiple Users**
   - User A and User B open chat
   - Both should see each other as "Online" with green dots
   - User A closes tab → User B should see "Offline" and last seen time

3. **Network Interruption**
   - Disconnect network → Should transition to offline after heartbeat timeout
   - Reconnect → Should return to "Online"

### Unread Counter Testing
1. **Initial Load**
   - Open chat app → Unread counts match database values
   - Counts should appear as blue badges

2. **Real-time Updates**
   - User A sends message to User B
   - User B's chat list should show unread badge increment
   - User B opens chat → Badge should disappear

3. **Edge Cases**
   - Open chat while message arrives → Should NOT increment
   - Receive multiple messages → Counter adds up correctly
   - Switch between chats → Each maintains correct count

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Presence Tracking | ✅ | ✅ | ✅ | ✅ |
| Visibility API | ✅ | ✅ | ✅ | ✅ |
| Activity Events | ✅ | ✅ | ✅ | ✅ |
| Socket.IO | ✅ | ✅ | ✅ | ✅ |
| Unread Badges | ✅ | ✅ | ✅ | ✅ |

## Performance Considerations

### Presence Service
- **Heartbeat**: 30 seconds interval (low overhead)
- **Activity Events**: Debounced, passive listeners
- **Memory**: Minimal (Map of user IDs → presence objects)
- **Network**: ~100 bytes per heartbeat

### Unread Counter
- **No Additional API Calls**: Uses existing thread data
- **Local State Updates**: React state management only
- **Real-time**: Socket.IO broadcasts (already implemented)

## Future Enhancements

### Presence
- [ ] Custom status messages ("In a meeting", "On vacation")
- [ ] Typing indicator integration with presence
- [ ] "Last active" timestamp in chat
- [ ] Push notifications when user comes online

### Unread Counter
- [ ] Different badge colors for mentions vs. regular messages
- [ ] Sound notification for new unread messages
- [ ] Desktop notifications with unread count
- [ ] Mark as unread feature
- [ ] Unread indicator in browser tab title

## Troubleshooting

### Presence Not Updating
1. **Check Socket Connection**: Ensure `isConnected` is true
2. **Verify Events**: Look for `presence:status` in browser console
3. **Server Logs**: Check socket-server logs for presence events
4. **Browser Console**: Look for PresenceService initialization log

### Unread Count Incorrect
1. **Reload Page**: Check if API returns correct initial count
2. **Check Active Chat**: Messages in active chat shouldn't increment
3. **Database**: Verify `unread_count` in `wp_chatpulse_message_threads` table
4. **Mark as Read**: Ensure read receipts are working

### Green Dot Not Showing
1. **Participant IDs**: Verify `participantIds` array is populated
2. **Presence Data**: Check `chat.isOnline` in React DevTools
3. **CSS Classes**: Ensure green dot CSS is not being overridden
4. **Bot Chats**: Bots should NOT show online indicator

## Files Modified

### New Files
- `wp-plugin/app/resources/PresenceService.ts` (280 lines)

### Updated Files
- `wp-plugin/app/resources/ChatService.ts` (+40 lines)
- `wp-plugin/app/resources/ChatApp.tsx` (+60 lines)
- `socket-server/server.js` (+80 lines)

## API Changes

### ChatThread Interface
```typescript
interface ChatThread {
  id: number;
  type: 'private' | 'group';
  title: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  participants?: any[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: number;
  };
  unread_count?: number;  // ← Already existed, now properly used
}
```

### ChatServiceEvents Interface
```typescript
export interface ChatServiceEvents {
  // ... existing events
  onUserPresenceChanged: (presence: UserPresence) => void;  // NEW
  onBulkPresenceUpdate: (presences: Map<number, UserPresence>) => void;  // NEW
}
```

## Conclusion

Both features are now fully implemented and integrated:

✅ **User Presence System**
- Modular, reusable PresenceService
- Real-time online/offline/away status
- Activity tracking and heartbeat
- Green dot indicators in UI
- Last seen timestamps

✅ **Unread Message Counter**
- Real-time unread badge updates
- Proper increment/reset logic
- Integration with existing API
- Visual blue badges with counts

The system is production-ready and follows best practices for real-time chat applications.
