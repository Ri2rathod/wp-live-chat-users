<?php

namespace WPLCAPP\admin;

defined('ABSPATH') or die('Something went wrong');

class WPLCApiSettingsAdmin {

    /**
     * @var WPLCApiSettingsAdmin
     */
    private static $instance;

    /**
     * Get singleton instance
     */
    public static function instance() {
        if ( ! isset( self::$instance ) && ! ( self::$instance instanceof WPLCApiSettingsAdmin ) ) {
            self::$instance = new WPLCApiSettingsAdmin();
        }

        return self::$instance;
    }

    /**
     * Initialize the admin interface
     */
    public function init() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'WPLC API Settings',
            'WPLC API', 
            'manage_options',
            'wplc-api-settings',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Render the admin page (now loads React app)
     */
    public function render_admin_page() {
        // Enqueue admin assets
        $this->enqueue_admin_assets();
        
        ?>
        <div id="wplc-admin-settings-root"></div>
        <?php
    }

    /**
     * Enqueue admin assets for React app
     */
    private function enqueue_admin_assets() {
        // Use kucrut/vite-for-wp enqueue_asset function
        \Kucrut\Vite\enqueue_asset(
            WP_LIVE_CHAT_USERS_DIR . 'static',
            'app/resources/main-admin.tsx',
            [
                'handle' => 'wplc-admin-settings',
                'dependencies' => [],
                'in-footer' => true,
            ]
        );
        
        // Localize WordPress API settings
        wp_localize_script('wplc-admin-settings', 'wpApiSettings', array(
            'root' => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => array(
                'id' => get_current_user_id(),
                'name' => wp_get_current_user()->display_name,
                'email' => wp_get_current_user()->user_email
            )
        ));
    }
}