<?php

namespace Threadnest\database;

use Threadnest\database\classes\ThreadnestMigrator;

defined('ABSPATH') or die('Something went wrong');

class ThreadnestDatabaseManager {

    /**
     * @var ThreadnestDatabaseManager
     */
    private static $instance;

    /**
     * @var ThreadnestMigrator
     */
    private $migrator;

    /**
     * Get singleton instance
     *
     * @return ThreadnestDatabaseManager
     */
    public static function instance() {
        if ( ! isset( self::$instance ) && ! ( self::$instance instanceof ThreadnestDatabaseManager ) ) {
            self::$instance = new ThreadnestDatabaseManager();
        }

        return self::$instance;
    }

    /**
     * Initialize the database manager
     */
    public function init() {
        $this->migrator = ThreadnestMigrator::instance('threadnest');
        
        // Setup migrations table on plugin activation
        add_action('wp_loaded', array($this, 'setup_migrations_table'));
    }

    /**
     * Setup the migrations table
     */
    public function setup_migrations_table() {
        if (get_option('threadnest_migrations_table_created', false)) {
            return;
        }

        $this->migrator->setup();
        update_option('threadnest_migrations_table_created', true);
    }

    /**
     * Run all pending migrations
     */
    public function run_migrations() {
        $this->setup_migrations_table();
        
        $count = $this->migrator->run();
        
        if ($count > 0) {
            error_log("[Threadnest] Ran {$count} migrations successfully");
        }
    }

    /**
     * Rollback migrations (for development/testing)
     */
    public function rollback_migrations() {
        $count = $this->migrator->run(null, true);
        
        if ($count > 0) {
            error_log("[Threadnest] Rolled back {$count} migrations successfully");
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
