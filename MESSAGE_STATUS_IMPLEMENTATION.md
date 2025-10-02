# Message Delivery and Read Status Implementation

## Overview
Implemented comprehensive message delivery and read status tracking using the `wp_wplc_message_read_receipts` table with separate columns for `delivered_at` and `read_at`.

## Database Changes

### Updated Table Structure
**Table:** `wp_wplc_message_read_receipts`

New columns:
- `delivered_at` (datetime, nullable) - When message was delivered to recipient's device
- `read_at` (datetime, nullable) - When message was read by recipient
- `created_at` (datetime, not null) - When the receipt record was created

### Migration Files

1. **Updated:** `2025_09_14_CreateMessageReadReceiptsTable.php`
   - Modified initial migration to include `delivered_at`, `read_at`, and `created_at` columns
   - Both `delivered_at` and `read_at` are nullable to allow separate tracking

2. **New:** `2025_10_02_AddDeliveredAtToReadReceipts.php`
   - Adds `delivered_at` and `created_at` columns to existing installations
   - Modifies `read_at` to allow NULL values
   - Adds index for `delivered_at` column
   - Includes rollback functionality

## Backend Changes

### WPLCRestApiController.php

#### 1. Message Sending (send_message)
- Automatically creates delivery receipts for all thread participants (except sender)
- Sets `delivered_at` timestamp when message is sent
- `read_at` remains NULL until recipient reads the message

```php
// Creates receipts with delivered_at for all recipients
$wpdb->insert($read_receipts_table, array(
    'message_id' => $message_id,
    'user_id' => $participant->user_id,
    'delivered_at' => $current_time,
    'read_at' => null
));
```

#### 2. Message Loading (get_thread_messages)
- Fetches read receipts for all messages
- Calculates delivery/read status based on receipts
- Status hierarchy:
  - `read` - All recipients have read the message
  - `delivered` - All/some recipients have received it
  - `sent` - Message sent but no delivery confirmation

```php
// Status calculation logic
if ($all_read) {
    $status = 'read';
} elseif ($any_read || $all_delivered) {
    $status = 'delivered';
} else {
    $status = 'sent';
}
```

#### 3. Marking Messages as Read (mark_messages_read)
- Updates existing receipts with `read_at` timestamp
- Also sets `delivered_at` if not already set
- Sends webhook notification for read receipts

```php
if (!$existing) {
    // New receipt: set both delivered_at and read_at
    $wpdb->insert($read_receipts_table, array(
        'message_id' => $msg_id,
        'user_id' => $user_id,
        'delivered_at' => $current_time,
        'read_at' => $current_time
    ));
} elseif (!$existing->read_at) {
    // Update existing: mark as read
    $wpdb->update($read_receipts_table, array(
        'read_at' => $current_time,
        'delivered_at' => $delivered_at ?? $current_time
    ));
}
```

## Frontend Changes

### ChatApp.tsx

Updated message status indicator to show different visual states:

```tsx
{message.status === 'pending' && (
  <span className="text-xs opacity-75">⏳</span>
)}
{message.status === 'sent' && (
  <span className="text-xs opacity-75">✓</span>
)}
{message.status === 'delivered' && (
  <span className="text-xs opacity-75 text-gray-300">✓✓</span>
)}
{message.status === 'read' && (
  <span className="text-xs opacity-90 text-blue-300">✓✓</span>
)}
```

**Status Icons:**
- ⏳ (Pending) - Message is being sent
- ✓ (Sent) - Message sent to server, single white checkmark
- ✓✓ (Delivered) - Message delivered to recipient, double gray checkmarks
- ✓✓ (Read) - Message read by recipient, double blue checkmarks

## How It Works

### Message Flow

1. **User sends message**
   - Message stored in `wp_wplc_messages` table
   - Delivery receipts created for all participants (except sender)
   - `delivered_at` set to current timestamp
   - `read_at` is NULL
   - Status: `sent` → `delivered`

2. **Recipient receives message**
   - Message appears in their chat
   - Already has delivery receipt from step 1
   - Status shows as `delivered` to sender

3. **Recipient reads message**
   - After 1 second of viewing, `mark_messages_read` is called
   - Receipt updated with `read_at` timestamp
   - Webhook sent to socket server
   - Sender's UI updated to show `read` status (blue checkmarks)

### Status Determination Logic

For sender's messages:
- Check all recipients' receipts
- If ALL have `read_at` → Status: `read`
- If ANY have `read_at` OR ALL have `delivered_at` → Status: `delivered`
- If SOME have `delivered_at` → Status: `delivered`
- Otherwise → Status: `sent`

## Testing Instructions

### 1. Run Migration

```bash
# Via REST API
curl -X POST "http://your-site.com/wp-json/wplc-chat/v1/admin/migrate" \
  -H "X-WP-Nonce: YOUR_NONCE"

# Or via WP-CLI
wp wplc migrate
```

### 2. Rebuild Frontend

```bash
cd /var/www/html/wp/wp-live-chat-users/wp-live-chat-users/wp-plugin
bun run build
```

### 3. Test Scenarios

#### Scenario 1: Single Message Delivery
1. User A sends message to User B
2. User A should see: ✓ (sent) → ✓✓ gray (delivered)
3. User B opens chat
4. User A should see: ✓✓ blue (read)

#### Scenario 2: Multiple Recipients (Group Chat)
1. User A sends message to group with Users B and C
2. Status shows `delivered` when both receive it
3. Status shows `read` only when ALL have read it
4. If only B reads it, status remains `delivered`

#### Scenario 3: Offline Recipient
1. User A sends message to offline User B
2. Status: `sent`
3. When B comes online, status: `delivered`
4. When B reads, status: `read`

### 4. Database Verification

```sql
-- Check receipts for a specific message
SELECT 
    rr.message_id,
    rr.user_id,
    u.display_name,
    rr.delivered_at,
    rr.read_at,
    rr.created_at
FROM wp_wplc_message_read_receipts rr
JOIN wp_users u ON rr.user_id = u.ID
WHERE rr.message_id = YOUR_MESSAGE_ID;

-- Check status calculation
SELECT 
    m.id as message_id,
    m.content,
    COUNT(rr.id) as total_recipients,
    SUM(CASE WHEN rr.delivered_at IS NOT NULL THEN 1 ELSE 0 END) as delivered_count,
    SUM(CASE WHEN rr.read_at IS NOT NULL THEN 1 ELSE 0 END) as read_count
FROM wp_wplc_messages m
LEFT JOIN wp_wplc_message_read_receipts rr ON m.id = rr.message_id
WHERE m.id = YOUR_MESSAGE_ID
GROUP BY m.id;
```

## Benefits

1. **Granular Tracking**: Separate columns for delivery and read status
2. **Accurate Status**: Status based on actual receipt data, not assumptions
3. **Scalable**: Works for both private and group chats
4. **Real-time Updates**: Webhook notifications for instant status changes
5. **Visual Feedback**: Clear icons matching WhatsApp/Telegram patterns
6. **Database Indexed**: Optimized queries with proper indexes

## API Endpoints Used

- `POST /wplc-chat/v1/threads/{id}/messages` - Send message (creates delivery receipts)
- `GET /wplc-chat/v1/threads/{id}/messages` - Load messages with status
- `POST /wplc-chat/v1/messages/read` - Mark messages as read
- `POST /wplc-chat/v1/admin/migrate` - Run database migrations

## Socket Events

- `message` - New message sent
- `message:received` - Message received by client
- `message:read` - Read receipt confirmation

## Notes

- Delivery receipts are created automatically when message is sent
- Read receipts are created when user views the message (1 second delay)
- Status is calculated dynamically based on ALL recipients' receipts
- For private chats, status reflects single recipient's state
- For group chats, all members must read for "read" status
