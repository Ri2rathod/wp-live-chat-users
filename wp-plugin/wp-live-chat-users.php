<?php

use WPLCAPP\baseClasses\WPLCApp;

/**
 * Plugin Name: WP Live Chat Users
 * Plugin URI:  https://github.com/Ri2rathod/wp-live-chat-users
 * Description: Real-time user-to-user chat plugin for WordPress using a self-hosted WebSocket (Socket.IO) server.
 * Version:     0.1.0
 * Author:      Rathod Ritesh
 * Author URI:  https://github.com/Ri2rathod
 * License:     GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wp-live-chat-users
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Prevent direct access
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Define plugin constants
 */
define( 'WP_LIVE_CHAT_USERS_VERSION', '0.1.0' );
define( 'WP_LIVE_CHAT_USERS_DIR', plugin_dir_path( __FILE__ ) );
define( 'WP_LIVE_CHAT_USERS_URL', plugin_dir_url( __FILE__ ) );
define('WP_LIVE_CHAT_USERS_BASE_NAME', plugin_basename(__FILE__));

$wplc_app = new WPLCApp();

// Register activation hook
register_activation_hook(__FILE__, [$wplc_app, 'activate']);

// Initialize the plugin
$wplc_app->init();
