<?php

namespace WPLCAPP\integration;

defined('ABSPATH') or die('Something went wrong');

class WPLCChatIntegration {

    /**
     * @var WPLCChatIntegration
     */
    private static $instance;

    /**
     * Get singleton instance
     */
    public static function instance() {
        if ( ! isset( self::$instance ) && ! ( self::$instance instanceof WPLCChatIntegration ) ) {
            self::$instance = new WPLCChatIntegration();
        }

        return self::$instance;
    }

    /**
     * Initialize integration hooks
     */
    public function init() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_chat_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_chat_scripts'));
    }

    /**
     * Enqueue scripts and localize data for chat
     */
    public function enqueue_chat_scripts() {
        // Only enqueue on pages that need the chat
        if (!$this->should_load_chat()) {
            return;
        }

        // Localize WordPress API settings
        wp_localize_script('wpcl-chat', 'wpApiSettings', array(
            'root' => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => $this->get_current_user_data()
        ));

        // Localize chat-specific settings
        wp_localize_script('wpcl-chat', 'wplcChatSettings', array(
            'socketUrl' => $this->get_socket_server_url(),
            'apiNamespace' => 'wplc-chat/v1',
            'currentUser' => $this->get_current_user_data(),
            'settings' => array(
                'enableTypingIndicators' => true,
                'enableReadReceipts' => true,
                'enablePresenceStatus' => true,
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

    /**
     * Check if chat should be loaded on current page
     */
    private function should_load_chat() {
        // Load on pages with chat shortcode
        global $post;
        
        if ($post && has_shortcode($post->post_content, 'wpcl-chat')) {
            return true;
        }

        // Load in admin if on chat-related pages
        if (is_admin()) {
            $screen = get_current_screen();
            if ($screen && strpos($screen->id, 'wplc') !== false) {
                return true;
            }
        }

        // Allow filtering
        return apply_filters('wplc_should_load_chat', false);
    }

    /**
     * Add chat settings to admin
     */
    public function add_admin_settings() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    /**
     * Add settings page to admin menu
     */
    public function add_settings_page() {
        add_options_page(
            __('WP Live Chat Settings', 'wp-live-chat-users'),
            __('Live Chat', 'wp-live-chat-users'),
            'manage_options',
            'wplc-settings',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('wplc_settings', 'wplc_socket_server_url');
        register_setting('wplc_settings', 'wplc_enable_typing_indicators');
        register_setting('wplc_settings', 'wplc_enable_read_receipts');
        register_setting('wplc_settings', 'wplc_enable_presence_status');

        add_settings_section(
            'wplc_general_settings',
            __('General Settings', 'wp-live-chat-users'),
            array($this, 'render_general_section'),
            'wplc_settings'
        );

        add_settings_field(
            'wplc_socket_server_url',
            __('Socket Server URL', 'wp-live-chat-users'),
            array($this, 'render_socket_url_field'),
            'wplc_settings',
            'wplc_general_settings'
        );

        add_settings_field(
            'wplc_typing_indicators',
            __('Enable Typing Indicators', 'wp-live-chat-users'),
            array($this, 'render_typing_indicators_field'),
            'wplc_settings',
            'wplc_general_settings'
        );

        add_settings_field(
            'wplc_read_receipts',
            __('Enable Read Receipts', 'wp-live-chat-users'),
            array($this, 'render_read_receipts_field'),
            'wplc_settings',
            'wplc_general_settings'
        );

        add_settings_field(
            'wplc_presence_status',
            __('Enable Presence Status', 'wp-live-chat-users'),
            array($this, 'render_presence_status_field'),
            'wplc_settings',
            'wplc_general_settings'
        );
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('WP Live Chat Settings', 'wp-live-chat-users'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('wplc_settings');
                do_settings_sections('wplc_settings');
                submit_button();
                ?>
            </form>

            <div class="postbox" style="margin-top: 20px;">
                <h2 class="hndle" style="padding: 10px;"><?php _e('Server Status', 'wp-live-chat-users'); ?></h2>
                <div class="inside" style="padding: 10px;">
                    <div id="wplc-server-status">
                        <p><?php _e('Checking server status...', 'wp-live-chat-users'); ?></p>
                    </div>
                    <button type="button" class="button" id="wplc-check-server">
                        <?php _e('Check Server Status', 'wp-live-chat-users'); ?>
                    </button>
                </div>
            </div>

            <script>
            document.getElementById('wplc-check-server').addEventListener('click', function() {
                const statusDiv = document.getElementById('wplc-server-status');
                const socketUrl = document.getElementById('wplc_socket_server_url').value || 'http://localhost:3001';
                
                statusDiv.innerHTML = '<p><?php _e('Checking...', 'wp-live-chat-users'); ?></p>';
                
                fetch(socketUrl + '/health')
                    .then(response => response.json())
                    .then(data => {
                        statusDiv.innerHTML = `
                            <p style="color: green;">✓ <?php _e('Server is running', 'wp-live-chat-users'); ?></p>
                            <p><strong><?php _e('Connections:', 'wp-live-chat-users'); ?></strong> ${data.connections || 0}</p>
                            <p><strong><?php _e('Active Users:', 'wp-live-chat-users'); ?></strong> ${data.activeUsers || 0}</p>
                            <p><strong><?php _e('Timestamp:', 'wp-live-chat-users'); ?></strong> ${data.timestamp}</p>
                        `;
                    })
                    .catch(error => {
                        statusDiv.innerHTML = `<p style="color: red;">✗ <?php _e('Server is not accessible', 'wp-live-chat-users'); ?></p>`;
                    });
            });
            </script>
        </div>
        <?php
    }

    /**
     * Render general section
     */
    public function render_general_section() {
        echo '<p>' . __('Configure the general settings for WP Live Chat.', 'wp-live-chat-users') . '</p>';
    }

    /**
     * Render socket URL field
     */
    public function render_socket_url_field() {
        $value = get_option('wplc_socket_server_url', 'http://localhost:3001');
        echo '<input type="url" id="wplc_socket_server_url" name="wplc_socket_server_url" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<p class="description">' . __('URL of the Socket.IO server (e.g., http://localhost:3001)', 'wp-live-chat-users') . '</p>';
    }

    /**
     * Render typing indicators field
     */
    public function render_typing_indicators_field() {
        $value = get_option('wplc_enable_typing_indicators', '1');
        echo '<input type="checkbox" id="wplc_typing_indicators" name="wplc_enable_typing_indicators" value="1" ' . checked($value, '1', false) . ' />';
        echo '<label for="wplc_typing_indicators">' . __('Show typing indicators when users are typing', 'wp-live-chat-users') . '</label>';
    }

    /**
     * Render read receipts field
     */
    public function render_read_receipts_field() {
        $value = get_option('wplc_enable_read_receipts', '1');
        echo '<input type="checkbox" id="wplc_read_receipts" name="wplc_enable_read_receipts" value="1" ' . checked($value, '1', false) . ' />';
        echo '<label for="wplc_read_receipts">' . __('Show read receipts for messages', 'wp-live-chat-users') . '</label>';
    }

    /**
     * Render presence status field
     */
    public function render_presence_status_field() {
        $value = get_option('wplc_enable_presence_status', '1');
        echo '<input type="checkbox" id="wplc_presence_status" name="wplc_enable_presence_status" value="1" ' . checked($value, '1', false) . ' />';
        echo '<label for="wplc_presence_status">' . __('Show user presence status (online/offline)', 'wp-live-chat-users') . '</label>';
    }
}
