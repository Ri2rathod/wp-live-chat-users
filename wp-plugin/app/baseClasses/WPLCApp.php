<?php

namespace WPLCAPP\baseClasses;

/**
 * The code that runs during plugin activation
 */
defined('ABSPATH') or die('Something went wrong');

final class WPLCApp
{
    public function activate()
    {

    }
    public function init()
    {

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
                ?>
            <div class="wpcl-chat" data-attr="<?php echo wp_json_encode($atts) ?>" >

            </div>
            <?php
                return ob_get_clean();
            },
            [
                [
                    'entry' => 'app/resources/main.tsx',
                    'handle' => 'wpcl-chat',
                    'dependencies' => [],
                    'in_footer' => false,
                ]
            ]
        );


    }

}
