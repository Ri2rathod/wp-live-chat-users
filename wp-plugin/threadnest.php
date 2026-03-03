<?php

use Threadnest\baseClasses\ThreadnestApp;

/**
 * Plugin Name: Threadnest
 * Plugin URI:  https://wordpress.org/plugins/threadnest/
 * Description: Real-time user-to-user chat plugin for WordPress using a self-hosted WebSocket (Socket.IO) server.
 * Version:     0.1.0
 * Author:      Rathod Ritesh
 * Author URI:  https://github.com/Ri2rathod
 * License:     MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: threadnest
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Prevent direct access
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Define plugin constants
 */
define( 'THREADNEST_VERSION', '0.1.0' );
define( 'THREADNEST_DIR', plugin_dir_path( __FILE__ ) );
define( 'THREADNEST_URL', plugin_dir_url( __FILE__ ) );
define('THREADNEST_BASE_NAME', plugin_basename(__FILE__));

$threadnest_app = new ThreadnestApp();

// Register activation hook
register_activation_hook(__FILE__, [$threadnest_app, 'activate']);

// Initialize the plugin
$threadnest_app->init();
