<?php

namespace WPLCAPP\baseClasses;
/**
 * The code that runs during plugin activation
 */
defined('ABSPATH') or die('Something went wrong');

use WPLCAPP\database\WPLCDatabaseManager;
use WPLCAPP\admin\WPLCMigrationAdmin;
use WPLCAPP\admin\WPLCApiSettingsAdmin;
use WPLCAPP\api\WPLCRestApiController;
use WPLCAPP\api\WPLCRestApiRoutes;
use WPLCAPP\baseClasses\WPLCShortcodeManager;
use WPLCAPP\integration\WPLCChatIntegration;

final class WPLCApp
{
    public function activate()
    {
        // Initialize database manager on activation
        WPLCDatabaseManager::instance()->run_migrations();
    }
    
    public function init()
    {
        // Initialize database manager
        WPLCDatabaseManager::instance()->init();
        
        // Initialize REST API
        WPLCRestApiController::instance()->init();
        
        // Initialize admin interface
        if (is_admin()) {
            WPLCMigrationAdmin::instance()->init();
            WPLCApiSettingsAdmin::instance()->init();
            WPLCChatIntegration::instance()->add_admin_settings();
        }

        add_action('init', [$this, 'load_text_domain']);

        // Register shortcodes
        $this->register_shortcodes();
    }
    /**
     * Load plugin text domain for translation
     *
     * @return void
     */
    public function load_text_domain()
    {
        // Load the plugin text domain properly
        $domain = 'wp-live-chat-users';
        $locale = determine_locale();
        $mofile = $domain . '-' . $locale . '.mo';

        // Try to load from the languages directory first
        if (load_textdomain($domain, WP_LIVE_CHAT_USERS_DIR . '/languages/' . $mofile)) {
            return;
        }

        // Otherwise use the standard WordPress approach
        load_plugin_textdomain($domain, false, dirname(plugin_basename(WP_LIVE_CHAT_USERS_BASE_NAME)) . '/languages/');
    }

    public function register_shortcodes()
    {
        // Initialize the shortcode manager
        $shortcode_manager = new WPLCShortcodeManager(WP_LIVE_CHAT_USERS_DIR . 'static');
        
        // Register a shortcode with Vite assets
        $shortcode_manager->register(
            'wpcl-chat',
            function ($atts, $content) {
                $atts = shortcode_atts([
                    'title' => 'Default Title',
                    'image' => '',
                ], $atts);

                ob_start();
                $this->enqueue_chat_scripts();
                ?>
            <div class="wpcl-chat" data-attr='<?php echo wp_json_encode($atts) ?>' >
            </div>
            <?php
                return ob_get_clean();
            },
            [
                [
                    'entry' => 'app/resources/main.tsx',
                    'handle' => 'wpcl-chat',
                    'dependencies' => ['wpcl-chat-scripts'],
                    'in_footer' => false,
                ]
            ],
        );
    }

    /**
     * Enqueue and localize scripts for chat
     * This handler is called by the shortcode manager as a dependency
     */
    public function enqueue_chat_scripts()
    {
        // Register a dummy script handle for dependencies
        wp_register_script('wpcl-chat-scripts', '', [], WP_LIVE_CHAT_USERS_VERSION, ['in_footer' => true]);
        wp_enqueue_script('wpcl-chat-scripts');

        // Localize WordPress API settings
        wp_localize_script('wpcl-chat-scripts', 'wpApiSettings', array(
            'root' => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => $this->get_current_user_data()
        ));

        // Localize chat-specific settings
        wp_localize_script('wpcl-chat-scripts', 'wplcChatSettings', array(
            'socketUrl' => $this->get_socket_server_url(),
            'apiNamespace' => 'wplc-chat/v1',
            'currentUser' => $this->get_current_user_data(),
            'settings' => array(
                'enableTypingIndicators' => get_option('wplc_enable_typing_indicators', '1') === '1',
                'enableReadReceipts' => get_option('wplc_enable_read_receipts', '1') === '1',
                'enablePresenceStatus' => get_option('wplc_enable_presence_status', '1') === '1',
                'autoMarkAsRead' => true,
                'maxMessageLength' => 10000,
                'allowedFileTypes' => array('jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'),
                'maxFileSize' => 10 * 1024 * 1024 // 10MB
            )
        ));
    }

    /**
     * Get current user data for chat
     */
    private function get_current_user_data() {
        $current_user = wp_get_current_user();
        
        if (!$current_user->ID) {
            return null;
        }

        return array(
            'id' => $current_user->ID,
            'name' => $current_user->display_name,
            'email' => $current_user->user_email,
            'avatar' => get_avatar_url($current_user->ID, array('size' => 96)),
            'capabilities' => array(
                'can_chat' => user_can($current_user, 'read'),
                'can_upload' => user_can($current_user, 'upload_files'),
                'can_moderate' => user_can($current_user, 'moderate_comments')
            )
        );
    }

    /**
     * Get Socket.IO server URL
     */
    private function get_socket_server_url() {
        // Get from options or environment
        $socket_url = get_option('wplc_socket_server_url', '');
        
        if (empty($socket_url)) {
            // Fallback to environment variable or default
            $socket_url = defined('WPLC_SOCKET_SERVER_URL') 
                ? WPLC_SOCKET_SERVER_URL 
                : 'http://localhost:3001';
        }

        return apply_filters('wplc_socket_server_url', $socket_url);
    }

}
