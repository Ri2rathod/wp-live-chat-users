<?php

namespace Chatpulse\baseClasses;
/**
 * The code that runs during plugin activation
 */
defined('ABSPATH') or die('Something went wrong');

use Chatpulse\database\ChatpulseDatabaseManager;
use Chatpulse\admin\ChatpulseApiSettingsAdmin;
use Chatpulse\api\ChatpulseRestApiController;
use Chatpulse\baseClasses\ChatpulseShortcodeManager;

final class ChatpulseApp
{
    public function activate()
    {
        // Initialize database manager on activation
        ChatpulseDatabaseManager::instance()->run_migrations();
    }
    
    public function init()
    {
        // Initialize database manager
        ChatpulseDatabaseManager::instance()->init();
        
        // Initialize REST API
        ChatpulseRestApiController::instance()->init();
        
        // Initialize admin interface
        if (is_admin()) {
            ChatpulseApiSettingsAdmin::instance()->init();
        }

        // Register shortcodes
        $this->register_shortcodes();
    }
    public function register_shortcodes()
    {
        // Initialize the shortcode manager
        $shortcode_manager = new ChatpulseShortcodeManager(CHATPULSE_DIR . 'static');
        
        // Register a shortcode with Vite assets
        $shortcode_manager->register(
            'chatpulse-chat',
            function ($atts, $content) {
                $atts = shortcode_atts([
                    'title' => 'Default Title',
                    'image' => '',
                ], $atts);

                ob_start();
                $this->enqueue_chat_scripts();
                ?>
            <div class="chatpulse-chat" data-attr='<?php echo wp_json_encode($atts) ?>' >
            </div>
            <?php
                return ob_get_clean();
            },
            [
                [
                    'entry' => 'app/resources/main.tsx',
                    'handle' => 'chatpulse-chat',
                    'dependencies' => ['chatpulse-chat-scripts'],
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
        wp_register_script('chatpulse-chat-scripts', '', [], CHATPULSE_VERSION, ['in_footer' => true]);
        wp_enqueue_script('chatpulse-chat-scripts');

        // Localize WordPress API settings
        wp_localize_script('chatpulse-chat-scripts', 'wpApiSettings', array(
            'root' => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => $this->get_current_user_data()
        ));

        // Localize chat-specific settings
        wp_localize_script('chatpulse-chat-scripts', 'chatpulseChatSettings', array(
            'socketUrl' => $this->get_socket_server_url(),
            'apiNamespace' => 'chatpulse-chat/v1',
            'currentUser' => $this->get_current_user_data(),
            'settings' => array(
                'enableTypingIndicators' => get_option('chatpulse_enable_typing_indicators', '1') === '1',
                'enableReadReceipts' => get_option('chatpulse_enable_read_receipts', '1') === '1',
                'enablePresenceStatus' => get_option('chatpulse_enable_presence_status', '1') === '1',
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
        $socket_url = get_option('chatpulse_socket_server_url', '');
        
        if (empty($socket_url)) {
            // Fallback to environment variable or default
            $socket_url = defined('Chatpulse_SOCKET_SERVER_URL') 
                ? Chatpulse_SOCKET_SERVER_URL 
                : 'http://localhost:3001';
        }

        return apply_filters('chatpulse_socket_server_url', $socket_url);
    }

}
