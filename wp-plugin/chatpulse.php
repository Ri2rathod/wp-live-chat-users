<?php

use Chatpulse\baseClasses\ChatpulseApp;

/**
 * Plugin Name: Chatpulse
 * Plugin URI:  https://github.com/Ri2rathod/chatpulse
 * Description: Real-time user-to-user chat plugin for WordPress using a self-hosted WebSocket (Socket.IO) server.
 * Version:     0.1.0
 * Author:      Rathod Ritesh
 * Author URI:  https://github.com/Ri2rathod
 * License:     GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: chatpulse
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Prevent direct access
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Define plugin constants
 */
define( 'CHATPULSE_VERSION', '0.1.0' );
define( 'CHATPULSE_DIR', plugin_dir_path( __FILE__ ) );
define( 'CHATPULSE_URL', plugin_dir_url( __FILE__ ) );
define('CHATPULSE_BASE_NAME', plugin_basename(__FILE__));

$chatpulse_app = new ChatpulseApp();

// Register activation hook
register_activation_hook(__FILE__, [$chatpulse_app, 'activate']);

// Initialize the plugin
$chatpulse_app->init();
