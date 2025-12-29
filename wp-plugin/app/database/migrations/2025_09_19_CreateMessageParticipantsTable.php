<?php

namespace Chatpulse\database\migrations;

use Chatpulse\database\classes\ChatpulseAbstractMigration;

class CreateMessageParticipantsTable extends ChatpulseAbstractMigration {

    public function run() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'chatpulse_message_participants';
        $collation = $this->get_collation();

        $sql = "CREATE TABLE {$table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            thread_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            role enum('member', 'admin', 'owner') NOT NULL DEFAULT 'member',
            joined_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY idx_thread_user (thread_id, user_id),
            KEY idx_thread_id (thread_id),
            KEY idx_user_id (user_id),
            FOREIGN KEY (thread_id) REFERENCES {$wpdb->prefix}chatpulse_message_threads(id) ON DELETE CASCADE
        ) {$collation};";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Log success
        error_log("[Chatpulse Migration] Successfully created wp_chatpulse_message_participants table");
    }

    public function rollback() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'chatpulse_message_participants';
        $wpdb->query($wpdb->prepare("DROP TABLE IF EXISTS `%s`", $table_name));

        error_log("[Chatpulse Migration] Successfully dropped wp_chatpulse_message_participants table");
    }
}
