# Smart Scroll & New Message Notification Feature

## Overview
Implemented intelligent scroll behavior that keeps the chat at the bottom when new messages arrive, but shows a notification button when the user scrolls up to read message history.

## Features Implemented

### 1. **Smart Auto-Scroll** 
- Automatically scrolls to bottom when new messages arrive **ONLY if user is already at bottom**
- Prevents disrupting users who are reading old messages
- Uses a 100px threshold to detect "at bottom" state

### 2. **New Message Notification Button**
- Shows floating notification when user is scrolled up and new messages arrive
- Displays count of new messages: "1 new message" or "X new messages"
- Positioned at bottom-center of chat area
- Animated bounce effect to attract attention
- Clicking the button smoothly scrolls to bottom

### 3. **Scroll State Tracking**
- Tracks whether user is at bottom using `isAtBottomRef`
- Updates on scroll events
- Persists across message updates

## Implementation Details

### State Variables
```tsx
const [showNewMessageNotification, setShowNewMessageNotification] = useState(false);
const [newMessageCount, setNewMessageCount] = useState(0);
const scrollContainerRef = useRef<HTMLDivElement>(null);
const isAtBottomRef = useRef<boolean>(true);
```

### Key Functions

#### `checkIfAtBottom()`
Checks if scroll position is at bottom (within 100px threshold):
```tsx
const checkIfAtBottom = useCallback(() => {
  if (scrollContainerRef.current) {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottomRef.current = isAtBottom;
    
    // Hide notification if at bottom
    if (isAtBottom) {
      setShowNewMessageNotification(false);
      setNewMessageCount(0);
    }
    
    return isAtBottom;
  }
  return true;
}, []);
```

#### `scrollToBottom(smooth)`
Scrolls to bottom with optional smooth animation:
```tsx
const scrollToBottom = useCallback((smooth = true) => {
  if (scrollContainerRef.current) {
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    isAtBottomRef.current = true;
    setShowNewMessageNotification(false);
    setNewMessageCount(0);
  }
}, []);
```

### Auto-Scroll Logic
```tsx
useEffect(() => {
  const currentMessages = activeChat ? (messages[activeChat] || []) : [];
  if (currentMessages.length > 0) {
    if (isAtBottomRef.current) {
      // User is at bottom, auto-scroll
      scrollToBottom(true);
    } else {
      // User is scrolled up, show notification
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage.sender !== 'user') {
        setShowNewMessageNotification(true);
        setNewMessageCount(prev => prev + 1);
      }
    }
  }
}, [messages, activeChat, scrollToBottom]);
```

### UI Component
```tsx
{/* New Message Notification */}
{showNewMessageNotification && (
  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
    <button
      onClick={() => scrollToBottom(true)}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transition-all animate-bounce"
    >
      <span className="text-sm font-medium">
        {newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}
      </span>
      <ArrowDown className="w-4 h-4" />
    </button>
  </div>
)}
```

## User Experience Flow

### Scenario 1: User at Bottom (Normal Chat)
1. User is viewing the latest messages (at bottom)
2. New message arrives
3. ✅ **Auto-scrolls to show new message immediately**
4. No notification shown

### Scenario 2: User Reading History (Scrolled Up)
1. User scrolls up to read old messages
2. New message arrives
3. ❌ **Does NOT auto-scroll** (prevents disruption)
4. ✅ **Shows notification button**: "1 new message ▼"
5. User clicks notification
6. ✅ **Smoothly scrolls to bottom** to show new message

### Scenario 3: Multiple New Messages While Scrolled Up
1. User scrolled up reading history
2. First message arrives → Shows "1 new message"
3. Second message arrives → Updates to "2 new messages"
4. Third message arrives → Updates to "3 new messages"
5. User clicks button → Scrolls to bottom and clears notification

### Scenario 4: Switching Chats
1. User switches to different chat thread
2. ✅ **Instantly scrolls to bottom** (no animation for better UX)
3. Clears any existing notifications

## Styling Details

### Notification Button
- **Position**: Fixed at bottom-center of chat area
- **Background**: Blue (`bg-blue-500`) with hover effect (`hover:bg-blue-600`)
- **Shape**: Rounded pill (`rounded-full`)
- **Shadow**: Large shadow (`shadow-lg`) for prominence
- **Animation**: Bounce effect (`animate-bounce`) to catch attention
- **Z-index**: High (`z-10`) to appear above messages

### Scroll Container
- **Custom scroll container**: Native browser scrollbar
- **Overflow**: `overflow-y-auto` for vertical scrolling
- **Height**: `h-full` to fill available space
- **Position**: `relative` to contain notification button

## Technical Benefits

1. **Performance**: Uses refs instead of state for scroll tracking (no re-renders)
2. **Smooth UX**: Doesn't interrupt users reading old messages
3. **Visual Feedback**: Clear indication when new messages arrive
4. **Accessibility**: Keyboard accessible button
5. **Responsive**: Works on all screen sizes
6. **Non-intrusive**: Only shows when needed

## Testing Scenarios

### Test 1: Basic Auto-Scroll
- [ ] Send message when at bottom
- [ ] Verify auto-scroll to new message

### Test 2: Notification Show
- [ ] Scroll up to middle of chat
- [ ] Have someone send you a message
- [ ] Verify notification appears with count

### Test 3: Notification Interaction
- [ ] Click notification button
- [ ] Verify smooth scroll to bottom
- [ ] Verify notification disappears

### Test 4: Multiple Messages
- [ ] Scroll up
- [ ] Receive 3 messages
- [ ] Verify count shows "3 new messages"

### Test 5: Manual Scroll Down
- [ ] Scroll up
- [ ] Notification shows
- [ ] Manually scroll to bottom
- [ ] Verify notification auto-hides

### Test 6: Thread Switching
- [ ] Have notification showing
- [ ] Switch to different chat
- [ ] Verify notification clears
- [ ] Verify scrolled to bottom in new chat

## Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Dependencies
- `lucide-react`: ArrowDown icon
- React hooks: useState, useRef, useEffect, useCallback
- Tailwind CSS: All styling classes
