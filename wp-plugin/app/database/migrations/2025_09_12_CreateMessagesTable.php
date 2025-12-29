<?php

namespace WPLCAPP\database\migrations;

use WPLCAPP\database\classes\WPLCAbstractMigration;

class CreateMessagesTable extends WPLCAbstractMigration {

    public function run() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'wplc_messages';
        $collation = $this->get_collation();

        $sql = "CREATE TABLE {$table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            thread_id bigint(20) unsigned NOT NULL,
            sender_id bigint(20) unsigned NOT NULL,
            content longtext NOT NULL,
            content_type enum('text/plain', 'text/markdown', 'reaction', 'system') NOT NULL DEFAULT 'text/plain',
            status enum('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_thread_id (thread_id),
            KEY idx_sender_id (sender_id),
            KEY idx_created_at (created_at),
            KEY idx_status (status),
            FOREIGN KEY (thread_id) REFERENCES {$wpdb->prefix}wplc_message_threads(id) ON DELETE CASCADE
        ) {$collation};";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Log success
        error_log("[WPLC Migration] Successfully created wp_wplc_messages table");
    }

    public function rollback() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'wplc_messages';
        $wpdb->query($wpdb->prepare("DROP TABLE IF EXISTS `%s`", $table_name));

        error_log("[WPLC Migration] Successfully dropped wp_wplc_messages table");
    }
}
