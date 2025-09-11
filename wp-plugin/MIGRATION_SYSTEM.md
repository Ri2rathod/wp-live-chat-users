# WPLC Database Migration System

## Overview
This migration system has been created for the WP Live Chat Users plugin with the `wplc` prefix. It provides a robust database migration framework similar to Laravel or other modern frameworks.

## Files Created

### Core Migration Classes
1. **WPLCAbstractMigration.php** - Base abstract class for all migrations
2. **WPLCMigrator.php** - Main migrator class handling migration execution
3. **WPLCDatabaseManager.php** - Database manager for plugin integration
4. **WPLCMigrationAdmin.php** - Admin interface for migration management

### Migration Files
1. **CreateMessageThreadsTable.php** - Creates `wp_wplc_message_threads` table
2. **CreateMessagesTable.php** - Creates `wp_wplc_messages` table
3. **CreateMessageAttachmentsTable.php** - Creates `wp_wplc_message_attachments` table
4. **CreateMessageReadReceiptsTable.php** - Creates `wp_wplc_message_read_receipts` table

### Support Files
1. **migration.stub** - Template for creating new migrations
2. **WPLCMigrate.php** - WP-CLI command for running migrations

## Database Tables

### wp_wplc_message_threads
- `id` (bigint, PK, auto_increment)
- `type` (enum: 'private', 'group')
- `title` (varchar, nullable)
- `created_by` (bigint, user_id)
- `created_at`, `updated_at` (datetime)

### wp_wplc_messages
- `id` (bigint, PK, auto_increment)
- `thread_id` (bigint, FK to message_threads)
- `sender_id` (bigint, user_id)
- `content` (longtext)
- `content_type` (enum: 'text/plain', 'text/markdown', 'reaction', 'system')
- `status` (enum: 'sent', 'delivered', 'read')
- `created_at`, `updated_at` (datetime)

### wp_wplc_message_attachments
- `id` (bigint, PK, auto_increment)
- `message_id` (bigint, FK to messages)
- `file_path` (varchar)
- `mime_type` (varchar)
- `file_size` (bigint)
- `original_name` (varchar)
- `created_at` (datetime)

### wp_wplc_message_read_receipts
- `id` (bigint, PK, auto_increment)
- `message_id` (bigint, FK to messages)
- `user_id` (bigint, user_id)
- `read_at` (datetime)

## Features

### Automatic Migration
- Migrations run automatically on plugin activation
- Migration tracking table (`wp_wplc_migrations`) keeps track of executed migrations

### Admin Interface
- Access via **Tools > WPLC Migrations** in WordPress admin
- Run pending migrations manually
- Rollback migrations (for development)
- View migration status

### WP-CLI Support
- `wp wplc migrate` - Run pending migrations
- `wp wplc migrate --rollback` - Rollback migrations
- `wp wplc migrate --migration=SpecificMigration` - Run specific migration

### Index Optimization
- Proper indexes on `thread_id`, `sender_id`, `created_at` for performance
- Foreign key constraints for data integrity
- Unique constraints where appropriate

## Usage

### Creating New Migrations
1. Use WP-CLI: `wp scaffold wplc-migration MigrationName`
2. Or manually create in `/app/database/migrations/` following the naming pattern

### Running Migrations
1. **Automatic**: Migrations run on plugin activation
2. **Admin Interface**: Go to Tools > WPLC Migrations
3. **WP-CLI**: `wp wplc migrate`

### Plugin Integration
The migration system is fully integrated into your plugin:
- Database manager initializes on plugin load
- Admin interface available for administrators
- Activation hook ensures migrations run on activation

## Security
- All database operations use WordPress standards
- Admin interface requires `manage_options` capability
- Nonce verification for admin actions
- SQL injection protection through WordPress WPDB

## Error Handling
- Comprehensive error logging
- Graceful handling of failed migrations
- Rollback capabilities for development
- Status reporting and debugging information
