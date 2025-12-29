<?php

namespace Chatpulse\database;

use Chatpulse\database\classes\ChatpulseMigrator;

defined('ABSPATH') or die('Something went wrong');

class ChatpulseDatabaseManager {

    /**
     * @var ChatpulseDatabaseManager
     */
    private static $instance;

    /**
     * @var ChatpulseMigrator
     */
    private $migrator;

    /**
     * Get singleton instance
     *
     * @return ChatpulseDatabaseManager
     */
    public static function instance() {
        if ( ! isset( self::$instance ) && ! ( self::$instance instanceof ChatpulseDatabaseManager ) ) {
            self::$instance = new ChatpulseDatabaseManager();
        }

        return self::$instance;
    }

    /**
     * Initialize the database manager
     */
    public function init() {
        $this->migrator = ChatpulseMigrator::instance('chatpulse');
        
        // Setup migrations table on plugin activation
        add_action('wp_loaded', array($this, 'setup_migrations_table'));
    }

    /**
     * Setup the migrations table
     */
    public function setup_migrations_table() {
        if (get_option('chatpulse_migrations_table_created', false)) {
            return;
        }

        $this->migrator->setup();
        update_option('chatpulse_migrations_table_created', true);
    }

    /**
     * Run all pending migrations
     */
    public function run_migrations() {
        $this->setup_migrations_table();
        
        $count = $this->migrator->run();
        
        if ($count > 0) {
            error_log("[Chatpulse] Ran {$count} migrations successfully");
        }
    }

    /**
     * Rollback migrations (for development/testing)
     */
    public function rollback_migrations() {
        $count = $this->migrator->run(null, true);
        
        if ($count > 0) {
            error_log("[Chatpulse] Rolled back {$count} migrations successfully");
        }
    }

    /**
     * Get migration status
     */
    public function get_migration_status() {
        return $this->migrator->get_migrations_by_plugin();
    }

    /**
     * Private constructor
     */
    private function __construct() {
    }

    /**
     * Prevent cloning
     */
    private function __clone() {
    }

    /**
     * Prevent unserializing
     */
    public function __wakeup() {
    }
}
