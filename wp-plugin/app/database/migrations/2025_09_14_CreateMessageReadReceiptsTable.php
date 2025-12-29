<?php

namespace Chatpulse\database\migrations;

use Chatpulse\database\classes\ChatpulseAbstractMigration;

class CreateMessageReadReceiptsTable extends ChatpulseAbstractMigration {

    public function run() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'chatpulse_message_read_receipts';
        $collation = $this->get_collation();

        $sql = "CREATE TABLE {$table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            message_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            delivered_at datetime DEFAULT NULL,
            read_at datetime DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY idx_message_user (message_id, user_id),
            KEY idx_message_id (message_id),
            KEY idx_user_id (user_id),
            KEY idx_delivered_at (delivered_at),
            KEY idx_read_at (read_at),
            FOREIGN KEY (message_id) REFERENCES {$wpdb->prefix}chatpulse_messages(id) ON DELETE CASCADE
        ) {$collation};";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Log success
        error_log("[Chatpulse Migration] Successfully created wp_chatpulse_message_read_receipts table");
    }

    public function rollback() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'chatpulse_message_read_receipts';
        $wpdb->query($wpdb->prepare("DROP TABLE IF EXISTS `%s`", $table_name));

        error_log("[Chatpulse Migration] Successfully dropped wp_chatpulse_message_read_receipts table");
    }
}
