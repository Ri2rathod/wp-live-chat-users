<?php

namespace Chatpulse\database\migrations;

use Chatpulse\database\classes\ChatpulseAbstractMigration;

class CreateMessageAttachmentsTable extends ChatpulseAbstractMigration {

    public function run() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'chatpulse_message_attachments';
        $collation = $this->get_collation();

        $sql = "CREATE TABLE {$table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            message_id bigint(20) unsigned NOT NULL,
            file_path varchar(500) NOT NULL,
            mime_type varchar(100) NOT NULL,
            file_size bigint(20) unsigned NOT NULL DEFAULT 0,
            original_name varchar(255) NOT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_message_id (message_id),
            KEY idx_mime_type (mime_type),
            FOREIGN KEY (message_id) REFERENCES {$wpdb->prefix}chatpulse_messages(id) ON DELETE CASCADE
        ) {$collation};";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Log success
        error_log("[Chatpulse Migration] Successfully created wp_chatpulse_message_attachments table");
    }

    public function rollback() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'chatpulse_message_attachments';
        $wpdb->query($wpdb->prepare("DROP TABLE IF EXISTS `%s`", $table_name));
    }
}
