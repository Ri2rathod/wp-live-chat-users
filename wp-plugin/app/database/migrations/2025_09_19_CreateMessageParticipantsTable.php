<?php

namespace WPLCAPP\database\migrations;

use WPLCAPP\database\classes\WPLCAbstractMigration;

class CreateMessageParticipantsTable extends WPLCAbstractMigration {

    public function run() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'wplc_message_participants';
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
            FOREIGN KEY (thread_id) REFERENCES {$wpdb->prefix}wplc_message_threads(id) ON DELETE CASCADE
        ) {$collation};";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Log success
        error_log("[WPLC Migration] Successfully created wp_wplc_message_participants table");
    }

    public function rollback() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'wplc_message_participants';
        $wpdb->query("DROP TABLE IF EXISTS {$table_name}");

        error_log("[WPLC Migration] Successfully dropped wp_wplc_message_participants table");
    }
}
