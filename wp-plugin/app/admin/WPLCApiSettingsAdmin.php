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
        add_action('admin_post_wplc_generate_api_key', array($this, 'handle_generate_api_key'));
        add_action('admin_post_wplc_save_api_settings', array($this, 'handle_save_api_settings'));
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
     * Render the admin page
     */
    public function render_admin_page() {
        $api_key = get_option('wplc_api_key', '');
        $api_user_id = get_option('wplc_api_user_id', 1);
        $api_enabled = get_option('wplc_api_enabled', false);
        
        ?>
        <div class="wrap">
            <h1>WPLC API Settings</h1>
            
            <div class="notice notice-info">
                <p><strong>API Endpoint:</strong> <?php echo site_url('/wp-json/wplc-chat/v1/'); ?></p>
            </div>

            <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                <?php wp_nonce_field('wplc_save_api_settings', 'wplc_api_nonce'); ?>
                <input type="hidden" name="action" value="wplc_save_api_settings">
                
                <table class="form-table">
                    <tr>
                        <th scope="row">Enable API Access</th>
                        <td>
                            <label>
                                <input type="checkbox" name="api_enabled" value="1" <?php checked($api_enabled); ?>>
                                Allow external API access (required for Socket.IO server)
                            </label>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">API User</th>
                        <td>
                            <?php 
                            wp_dropdown_users(array(
                                'name' => 'api_user_id',
                                'selected' => $api_user_id,
                                'show_option_none' => 'Select User',
                                'option_none_value' => 0
                            )); 
                            ?>
                            <p class="description">User account for API access (should have admin privileges)</p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button('Save Settings'); ?>
            </form>

            <hr>

            <h2>API Key Management</h2>
            
            <?php if (!empty($api_key)): ?>
                <div class="notice notice-success">
                    <p><strong>Current API Key:</strong></p>
                    <code style="background: #f1f1f1; padding: 8px; display: block; margin: 10px 0; font-family: monospace;">
                        <?php echo esc_html($api_key); ?>
                    </code>
                    <p class="description">Use this key in the Socket.IO server configuration.</p>
                </div>
            <?php else: ?>
                <div class="notice notice-warning">
                    <p>No API key generated yet. Generate one below to enable external API access.</p>
                </div>
            <?php endif; ?>

            <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                <?php wp_nonce_field('wplc_generate_api_key', 'wplc_api_key_nonce'); ?>
                <input type="hidden" name="action" value="wplc_generate_api_key">
                
                <p>
                    <?php 
                    submit_button(
                        empty($api_key) ? 'Generate API Key' : 'Regenerate API Key', 
                        'secondary',
                        'generate_key',
                        false
                    ); 
                    ?>
                </p>
                
                <?php if (!empty($api_key)): ?>
                    <p class="description" style="color: #d54e21;">
                        <strong>Warning:</strong> Regenerating will invalidate the current key and may break existing integrations.
                    </p>
                <?php endif; ?>
            </form>

            <hr>

            <h2>Usage Instructions</h2>
            <p>To use the API key in requests, include it in one of these ways:</p>
            <ol>
                <li><strong>Header:</strong> <code>X-WPLC-API-Key: YOUR_API_KEY</code></li>
                <li><strong>Query Parameter:</strong> <code>?api_key=YOUR_API_KEY</code></li>
            </ol>
            
            <h3>Socket.IO Server Configuration</h3>
            <p>Add these environment variables to your Socket.IO server:</p>
            <pre style="background: #f1f1f1; padding: 10px; border-radius: 4px;">
WP_API_KEY=<?php echo esc_html($api_key ?: 'YOUR_GENERATED_API_KEY'); ?>
WP_BASE_URL=<?php echo site_url(); ?>
            </pre>
        </div>
        <?php
    }

    /**
     * Handle API key generation
     */
    public function handle_generate_api_key() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized access');
        }

        if (!wp_verify_nonce($_POST['wplc_api_key_nonce'], 'wplc_generate_api_key')) {
            wp_die('Security check failed');
        }

        // Generate a secure API key
        $api_key = wp_generate_password(64, false);
        update_option('wplc_api_key', $api_key);

        // Redirect back with success message
        wp_redirect(add_query_arg(array(
            'page' => 'wplc-api-settings',
            'message' => 'key_generated'
        ), admin_url('options-general.php')));
        exit;
    }

    /**
     * Handle API settings save
     */
    public function handle_save_api_settings() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized access');
        }

        if (!wp_verify_nonce($_POST['wplc_api_nonce'], 'wplc_save_api_settings')) {
            wp_die('Security check failed');
        }

        // Save settings
        update_option('wplc_api_enabled', !empty($_POST['api_enabled']));
        update_option('wplc_api_user_id', absint($_POST['api_user_id']));

        // Redirect back with success message
        wp_redirect(add_query_arg(array(
            'page' => 'wplc-api-settings',
            'message' => 'settings_saved'
        ), admin_url('options-general.php')));
        exit;
    }
}