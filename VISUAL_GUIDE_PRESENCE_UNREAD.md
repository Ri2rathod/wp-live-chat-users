# Visual Guide: Presence & Unread Counter Features

## 🎨 Before & After Comparison

### Chat List - Before
```
┌─────────────────────────────────────┐
│ [Avatar] John Doe           2m ago  │
│          Hey, are you there?        │
├─────────────────────────────────────┤
│ [Avatar] Alice Smith        5m ago  │
│          Thanks for your help!      │
├─────────────────────────────────────┤
│ [Avatar] Bob Johnson        1h ago  │
│          See you tomorrow           │
└─────────────────────────────────────┘
```

### Chat List - After
```
┌─────────────────────────────────────┐
│ [Avatar🟢] John Doe         2m ago [3]│ ← Online + Unread
│            Hey, are you there?        │
├─────────────────────────────────────┤
│ [Avatar🟢] Alice Smith      5m ago    │ ← Online, No unread
│            Thanks for your help!      │
├─────────────────────────────────────┤
│ [Avatar] Bob Johnson        1h ago [1]│ ← Offline + Unread
│          See you tomorrow             │
└─────────────────────────────────────┘

Legend:
🟢 = Green dot (online indicator)
[3] = Blue badge (unread count)
```

---

## 💬 Chat Header - Before
```
┌─────────────────────────────────────┐
│ [Avatar] John Doe                   │
│          Online                     │ ← Static text
└─────────────────────────────────────┘
```

## 💬 Chat Header - After

### User is Online
```
┌─────────────────────────────────────┐
│ [Avatar🟢] John Doe                 │
│            Online                   │ ← Dynamic + green dot
└─────────────────────────────────────┘
```

### User is Away
```
┌─────────────────────────────────────┐
│ [Avatar] Alice Smith                │
│          Away                       │ ← Status indicator
└─────────────────────────────────────┘
```

### User is Offline
```
┌─────────────────────────────────────┐
│ [Avatar] Bob Johnson                │
│          2h ago                     │ ← Last seen time
└─────────────────────────────────────┘
```

---

## 🔄 Real-Time Updates

### Scenario 1: Message Received (Not Viewing)
```
BEFORE:
┌─────────────────────────────────────┐
│ [Avatar🟢] John Doe         2m ago  │
│            Previous message          │
└─────────────────────────────────────┘

⚡ New message arrives from John

AFTER:
┌─────────────────────────────────────┐
│ [Avatar🟢] John Doe         0m ago [1]│
│            Hey, check this out!      │
└─────────────────────────────────────┘
                                    ↑ Badge appears
```

### Scenario 2: Click to Open Chat
```
BEFORE CLICK:
┌─────────────────────────────────────┐
│ [Avatar🟢] John Doe         0m ago [3]│
│            Multiple unread messages  │
└─────────────────────────────────────┘

👆 User clicks

AFTER CLICK:
┌─────────────────────────────────────┐
│ [Avatar🟢] John Doe         0m ago   │
│            Multiple unread messages  │
└─────────────────────────────────────┘
                                    ↑ Badge disappears
```

### Scenario 3: User Goes Offline
```
TIME: 10:00 AM - User online
┌─────────────────────────────────────┐
│ [Avatar🟢] Alice Smith              │
│            Online                   │
└─────────────────────────────────────┘

⏱️ User disconnects

TIME: 10:05 AM - User offline
┌─────────────────────────────────────┐
│ [Avatar] Alice Smith                │
│          5m ago                     │
└─────────────────────────────────────┘
                     ↑ Last seen timestamp
```

---

## 🎯 Presence Indicators

### Avatar with Presence Dot
```
Online User:
     ┌─────────┐
     │         │
     │  [A]    │  Avatar
     │     🟢  │  ← Green dot (bottom-right)
     └─────────┘

Offline User:
     ┌─────────┐
     │         │
     │  [A]    │  Avatar
     │         │  ← No dot
     └─────────┘
```

### Unread Badge
```
With Unread:
"Hey there!"  [3]
              ↑ Blue circle with white number

No Unread:
"Hey there!"
              ↑ No badge
```

---

## 📊 Status Flow Diagram

```
User Opens Browser
        ↓
   Connect Socket
        ↓
   Send Heartbeat (every 30s)
        ↓
   Status: ONLINE 🟢
        ↓
   ┌────────────┐
   │ Activity?  │ ─ YES → Reset timer → ONLINE 🟢
   └────────────┘
        │
        NO (5 min)
        ↓
   Status: AWAY 🟡
        ↓
   Close Browser
        ↓
   Disconnect Socket
        ↓
   Status: OFFLINE ⚫
        ↓
   Show "Last seen" timestamp
```

---

## 💡 Unread Count Logic

```
New Message Received
        ↓
    ┌──────────────────┐
    │ From me?         │ ─ YES → ❌ Don't count
    └──────────────────┘
        │ NO
        ↓
    ┌──────────────────┐
    │ Chat is active?  │ ─ YES → ❌ Don't count
    └──────────────────┘
        │ NO
        ↓
    ✅ Increment counter
        ↓
    Show blue badge [+1]
```

---

## 🖥️ Multi-User Scenario

### User A's View
```
┌──────────────────────────────────────┐
│ 👤 MY CHATS                          │
├──────────────────────────────────────┤
│ [B🟢] User B          Online      [2]│ ← B is online, 2 unread
│       Last message from B...         │
├──────────────────────────────────────┤
│ [C] User C            5h ago      [1]│ ← C is offline, 1 unread
│       Last message from C...         │
└──────────────────────────────────────┘
```

### User B's View (at the same time)
```
┌──────────────────────────────────────┐
│ 👤 MY CHATS                          │
├──────────────────────────────────────┤
│ [A🟢] User A          Online         │ ← A is online, no unread
│       Last message from A...         │
├──────────────────────────────────────┤
│ [C] User C            5h ago      [1]│ ← C is offline, 1 unread
│       Last message from C...         │
└──────────────────────────────────────┘
```

---

## 🔔 Notification Badge Examples

```
One Unread:
[1]  ← Small blue circle

Multiple Unread:
[9]  ← Standard size

Many Unread:
[99+] ← Overflow (if needed)
```

---

## 🌐 Cross-Platform Consistency

### Desktop Browser
```
┌─────────────────────────────────────────┐
│ 🟢 Large green dot                      │
│ [15] Full badge with padding            │
└─────────────────────────────────────────┘
```

### Mobile Browser
```
┌──────────────────────────────┐
│ 🟢 Smaller green dot         │
│ [5] Compact badge            │
└──────────────────────────────┘
```

---

## ⚡ Real-Time Events Timeline

```
00:00 - User A opens app
        → Sends presence:update (online)
        → Server broadcasts to all users
        
00:01 - User B sees green dot on User A's avatar
        → UI updates automatically
        
00:02 - User A sends message to User B
        → User B's unread count: [1]
        
00:03 - User B opens chat with User A
        → Unread count resets: [ ]
        
05:00 - User A idle for 5 minutes
        → Status changes to "Away"
        → User B sees status update
        
10:00 - User A closes browser
        → Server broadcasts offline status
        → User B sees "10m ago"
```

---

## 🎨 Color Scheme

```
Online Status:   🟢 Green (#10B981)
Away Status:     🟡 Yellow/Orange (text only)
Offline Status:  ⚫ Gray (no dot)
Unread Badge:    🔵 Blue (#3B82F6)
Badge Text:      ⚪ White (#FFFFFF)
Ring (dot):      ⚪ White 2px ring
```

---

## 📱 Responsive Behavior

### Desktop (Large Screens)
```
Chat List Item:
┌────────────────────────────────────────┐
│ [Avatar 48px 🟢] Name        Time [Badge]│
│                   Last message...       │
└────────────────────────────────────────┘
```

### Tablet (Medium Screens)
```
Chat List Item:
┌──────────────────────────────────┐
│ [Avatar 40px 🟢] Name    [Badge] │
│                  Last message     │
└──────────────────────────────────┘
```

### Mobile (Small Screens)
```
Chat List Item:
┌──────────────────────────┐
│ [🟢] Name       [Badge]  │
│     Last msg...          │
└──────────────────────────┘
```

---

## ✨ Animation Effects

### Green Dot Appearance
```
Offline → Online
  [ ]  →  [🟢]
          ↑ Fade in (0.3s)
```

### Badge Number Change
```
[2] → [3]
      ↑ Pulse effect (0.2s)
```

### Status Text Change
```
"Online" → "5m ago"
           ↑ Smooth transition (0.2s)
```

---

## 🔍 Edge Cases Handled

### 1. Multiple Browser Tabs
```
Tab 1: ONLINE 🟢
Tab 2: ONLINE 🟢
→ User is online (both tabs active)

Close Tab 1: Still ONLINE 🟢
Close Tab 2: Now OFFLINE ⚫
```

### 2. Network Interruption
```
Connected: ONLINE 🟢
Network drops...
After 60s: OFFLINE ⚫
(heartbeat timeout)
```

### 3. Rapid Status Changes
```
Online → Away → Online
(All changes tracked smoothly)
```

### 4. Unread with Active Chat
```
Active Chat: Thread #1
Message arrives in Thread #1: [Don't count]
Message arrives in Thread #2: [Count! +1]
```

---

## 🎓 Usage Examples

### For End Users
1. **Check availability**: Look for green dot
2. **See unread messages**: Blue badge with count
3. **Open chat**: Badge disappears
4. **Check last activity**: Read "2h ago" text

### For Developers
```typescript
// Check online status
if (chatService.isUserOnline(userId)) {
  console.log('User is available');
}

// Get last seen
const lastSeen = chatService.getLastSeen(userId);
// Returns: "Online", "5m ago", "2h ago", etc.

// Request presence for multiple users
chatService.requestPresence([123, 456, 789]);
```

---

## 🏆 Success Criteria

✅ Green dot appears within 1 second of user connecting
✅ Status updates in real-time across all clients
✅ Unread badges increment immediately on message receipt
✅ Badges reset instantly when chat is opened
✅ No false offline status (heartbeat working)
✅ Last seen timestamps are accurate
✅ Away status triggers after exactly 5 minutes
✅ All UI elements are responsive

---

## 📞 Support Information

If you encounter issues:
1. Check browser console for Socket.IO connection
2. Verify socket server is running (port 3001)
3. Look for "PresenceService initialized" log
4. Test with two separate browsers
5. Review TROUBLESHOOTING.md for common issues

---

**This visual guide complements the technical documentation in PRESENCE_AND_UNREAD_FEATURES.md**
