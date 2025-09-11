<?php

namespace WPLCAPP\database\migrations;

use WPLCAPP\database\classes\WPLCAbstractMigration;

class CreateMessageThreadsTable extends WPLCAbstractMigration {

    public function run() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'wplc_message_threads';
        $collation = $this->get_collation();

        $sql = "CREATE TABLE {$table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            type enum('private', 'group') NOT NULL DEFAULT 'private',
            title varchar(255) NULL,
            created_by bigint(20) unsigned NOT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_created_by (created_by),
            KEY idx_type (type),
            KEY idx_created_at (created_at)
        ) {$collation};";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Log success
        error_log("[WPLC Migration] Successfully created wp_wplc_message_threads table");
    }

    public function rollback() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'wplc_message_threads';
        $wpdb->query("DROP TABLE IF EXISTS {$table_name}");

        error_log("[WPLC Migration] Successfully dropped wp_wplc_message_threads table");
    }
}
