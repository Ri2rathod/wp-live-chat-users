<?php

namespace WPLCAPP\database\CLI;

use WPLCAPP\database\classes\WPLCMigrator;

defined('ABSPATH') or die('Something went wrong');

class WPLCMigrate {

    /**
     * Run pending migrations
     *
     * ## OPTIONS
     *
     * [--rollback]
     * : Rollback migrations instead of running them
     *
     * [--migration=<migration>]
     * : Run specific migration
     *
     * ## EXAMPLES
     *
     *     wp wplc migrate
     *     wp wplc migrate --rollback
     *     wp wplc migrate --migration=CreateMessagesTable
     *
     * @param array $args
     * @param array $assoc_args
     */
    public function __invoke($args, $assoc_args) {
        $migrator = WPLCMigrator::instance();
        
        // Setup migrations table first
        $migrator->setup();
        
        $rollback = isset($assoc_args['rollback']);
        $migration = isset($assoc_args['migration']) ? $assoc_args['migration'] : null;
        
        if ($rollback) {
            \WP_CLI::line('Rolling back migrations...');
        } else {
            \WP_CLI::line('Running migrations...');
        }
        
        $count = $migrator->run($migration, $rollback);
        
        if ($count === 0) {
            \WP_CLI::success('No migrations to run.');
        } else {
            $action = $rollback ? 'rolled back' : 'ran';
            \WP_CLI::success("Successfully {$action} {$count} migration(s).");
        }
        
        // Show migration status
        $this->show_status();
    }
    
    /**
     * Show migration status
     */
    private function show_status() {
        $migrator = WPLCMigrator::instance();
        $status = $migrator->get_migrations_by_plugin();
        
        if (empty($status)) {
            \WP_CLI::line('No migrations found.');
            return;
        }
        
        \WP_CLI::line("\nMigration Status:");
        \WP_CLI::line("================");
        
        foreach ($status as $plugin_key => $plugin_info) {
            \WP_CLI::line("\nPlugin: {$plugin_info['plugin_name']} ({$plugin_key})");
            
            if (empty($plugin_info['migrations'])) {
                \WP_CLI::line('  No pending migrations.');
            } else {
                \WP_CLI::line('  Pending migrations:');
                foreach ($plugin_info['migrations'] as $migration) {
                    \WP_CLI::line("    - {$migration['name']}");
                }
            }
        }
    }
}
