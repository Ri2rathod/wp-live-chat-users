<?php

namespace Threadwp\database\migrations;

use Threadwp\database\classes\ThreadwpAbstractMigration;

class CreateMessageThreadsTable extends ThreadwpAbstractMigration {

    public function run() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'threadwp_message_threads';
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
        error_log("[Threadwp Migration] Successfully created wp_threadwp_message_threads table");
    }

    public function rollback() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'threadwp_message_threads';
        $wpdb->query($wpdb->prepare("DROP TABLE IF EXISTS `%s`", $table_name));

        error_log("[Threadwp Migration] Successfully dropped wp_threadwp_message_threads table");
    }
}
