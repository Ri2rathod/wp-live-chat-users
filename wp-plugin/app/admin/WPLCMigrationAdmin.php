<?php

namespace WPLCAPP\admin;

use WPLCAPP\database\WPLCDatabaseManager;

defined('ABSPATH') or die('Something went wrong');

class WPLCMigrationAdmin {

    /**
     * @var WPLCMigrationAdmin
     */
    private static $instance;

    /**
     * Get singleton instance
     */
    public static function instance() {
        if ( ! isset( self::$instance ) && ! ( self::$instance instanceof WPLCMigrationAdmin ) ) {
            self::$instance = new WPLCMigrationAdmin();
        }

        return self::$instance;
    }

    /**
     * Initialize the admin interface
     */
    public function init() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_post_wplc_run_migrations', array($this, 'handle_run_migrations'));
        add_action('admin_post_wplc_rollback_migrations', array($this, 'handle_rollback_migrations'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_management_page(
            'WPLC Migrations',
            'WPLC Migrations', 
            'manage_options',
            'wplc-migrations',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Render the admin page
     */
    public function render_admin_page() {
        $db_manager = WPLCDatabaseManager::instance();
        $migration_status = $db_manager->get_migration_status();
        
        ?>
        <div class="wrap">
            <h1>WPLC Database Migrations</h1>
            
            <?php if (isset($_GET['message'])): ?>
                <div class="notice notice-success is-dismissible">
                    <p><?php echo esc_html(urldecode($_GET['message'])); ?></p>
                </div>
            <?php endif; ?>
            
            <?php if (isset($_GET['error'])): ?>
                <div class="notice notice-error is-dismissible">
                    <p><?php echo esc_html(urldecode($_GET['error'])); ?></p>
                </div>
            <?php endif; ?>
            
            <div class="card">
                <h2>Migration Actions</h2>
                <p>Use these buttons to manage your database migrations.</p>
                
                <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" style="display:inline;">
                    <?php wp_nonce_field('wplc_migrations', 'wplc_nonce'); ?>
                    <input type="hidden" name="action" value="wplc_run_migrations">
                    <input type="submit" class="button button-primary" value="Run Migrations" 
                           onclick="return confirm('Are you sure you want to run all pending migrations?');">
                </form>
                
                <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" style="display:inline; margin-left: 10px;">
                    <?php wp_nonce_field('wplc_migrations', 'wplc_nonce'); ?>
                    <input type="hidden" name="action" value="wplc_rollback_migrations">
                    <input type="submit" class="button button-secondary" value="Rollback Migrations" 
                           onclick="return confirm('WARNING: This will rollback all migrations! Are you sure?');">
                </form>
            </div>
            
            <div class="card" style="margin-top: 20px;">
                <h2>Migration Status</h2>
                <?php if (empty($migration_status)): ?>
                    <p>No pending migrations found. All migrations are up to date!</p>
                <?php else: ?>
                    <p>The following migrations are pending:</p>
                    <?php foreach ($migration_status as $plugin_key => $plugin_info): ?>
                        <h3><?php echo esc_html($plugin_info['plugin_name']); ?> (<?php echo esc_html($plugin_key); ?>)</h3>
                        <?php if (empty($plugin_info['migrations'])): ?>
                            <p><em>No pending migrations for this plugin.</em></p>
                        <?php else: ?>
                            <ul>
                                <?php foreach ($plugin_info['migrations'] as $migration): ?>
                                    <li><code><?php echo esc_html($migration['name']); ?></code></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
            
            <div class="card" style="margin-top: 20px;">
                <h2>Database Tables</h2>
                <p>The following tables will be created by the migrations:</p>
                <ul>
                    <li><strong>wp_wplc_message_threads</strong> - Stores chat threads (private/group conversations)</li>
                    <li><strong>wp_wplc_messages</strong> - Stores individual messages</li>
                    <li><strong>wp_wplc_message_attachments</strong> - Stores file attachments</li>
                    <li><strong>wp_wplc_message_read_receipts</strong> - Stores read receipts</li>
                </ul>
            </div>
        </div>
        
        <style>
            .card {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                box-shadow: 0 1px 1px rgba(0,0,0,.04);
            }
        </style>
        <?php
    }

    /**
     * Handle run migrations request
     */
    public function handle_run_migrations() {
        if (!current_user_can('manage_options') || !wp_verify_nonce($_POST['wplc_nonce'], 'wplc_migrations')) {
            wp_die('Unauthorized access');
        }

        try {
            $db_manager = WPLCDatabaseManager::instance();
            $db_manager->run_migrations();
            
            $redirect_url = add_query_arg([
                'page' => 'wplc-migrations',
                'message' => urlencode('Migrations completed successfully!')
            ], admin_url('tools.php'));
            
        } catch (\Exception $e) {
            $redirect_url = add_query_arg([
                'page' => 'wplc-migrations',
                'error' => urlencode('Error running migrations: ' . $e->getMessage())
            ], admin_url('tools.php'));
        }

        wp_redirect($redirect_url);
        exit;
    }

    /**
     * Handle rollback migrations request
     */
    public function handle_rollback_migrations() {
        if (!current_user_can('manage_options') || !wp_verify_nonce($_POST['wplc_nonce'], 'wplc_migrations')) {
            wp_die('Unauthorized access');
        }

        try {
            $db_manager = WPLCDatabaseManager::instance();
            $db_manager->rollback_migrations();
            
            $redirect_url = add_query_arg([
                'page' => 'wplc-migrations',
                'message' => urlencode('Migrations rolled back successfully!')
            ], admin_url('tools.php'));
            
        } catch (\Exception $e) {
            $redirect_url = add_query_arg([
                'page' => 'wplc-migrations',
                'error' => urlencode('Error rolling back migrations: ' . $e->getMessage())
            ], admin_url('tools.php'));
        }

        wp_redirect($redirect_url);
        exit;
    }

    /**
     * Private constructor
     */
    private function __construct() {
    }
}
