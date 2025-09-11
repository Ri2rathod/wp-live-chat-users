<?php

namespace WPLCAPP\database;

use WPLCAPP\database\classes\WPLCMigrator;

defined('ABSPATH') or die('Something went wrong');

class WPLCDatabaseManager {

    /**
     * @var WPLCDatabaseManager
     */
    private static $instance;

    /**
     * @var WPLCMigrator
     */
    private $migrator;

    /**
     * Get singleton instance
     *
     * @return WPLCDatabaseManager
     */
    public static function instance() {
        if ( ! isset( self::$instance ) && ! ( self::$instance instanceof WPLCDatabaseManager ) ) {
            self::$instance = new WPLCDatabaseManager();
        }

        return self::$instance;
    }

    /**
     * Initialize the database manager
     */
    public function init() {
        $this->migrator = WPLCMigrator::instance('wplc');
        
        // Setup migrations table on plugin activation
        add_action('wp_loaded', array($this, 'setup_migrations_table'));
        
        // Run migrations on plugin activation
        register_activation_hook(WP_LIVE_CHAT_USERS_DIR . '/wp-live-chat-users.php', array($this, 'run_migrations'));
    }

    /**
     * Setup the migrations table
     */
    public function setup_migrations_table() {
        if (get_option('wplc_migrations_table_created', false)) {
            return;
        }

        $this->migrator->setup();
        update_option('wplc_migrations_table_created', true);
    }

    /**
     * Run all pending migrations
     */
    public function run_migrations() {
        $this->setup_migrations_table();
        
        $count = $this->migrator->run();
        
        if ($count > 0) {
            error_log("[WPLC] Ran {$count} migrations successfully");
        }
    }

    /**
     * Rollback migrations (for development/testing)
     */
    public function rollback_migrations() {
        $count = $this->migrator->run(null, true);
        
        if ($count > 0) {
            error_log("[WPLC] Rolled back {$count} migrations successfully");
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
