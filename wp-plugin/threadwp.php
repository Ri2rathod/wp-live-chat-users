<?php

use Threadwp\baseClasses\ThreadwpApp;

/**
 * Plugin Name: Threadwp
 * Plugin URI:  https://github.com/Ri2rathod/threadwp
 * Description: Real-time user-to-user chat plugin for WordPress using a self-hosted WebSocket (Socket.IO) server.
 * Version:     0.1.0
 * Author:      Rathod Ritesh
 * Author URI:  https://github.com/Ri2rathod
 * License:     GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: threadwp
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Prevent direct access
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Define plugin constants
 */
define( 'THREADWP_VERSION', '0.1.0' );
define( 'THREADWP_DIR', plugin_dir_path( __FILE__ ) );
define( 'THREADWP_URL', plugin_dir_url( __FILE__ ) );
define('THREADWP_BASE_NAME', plugin_basename(__FILE__));

$threadwp_app = new ThreadwpApp();

// Register activation hook
register_activation_hook(__FILE__, [$threadwp_app, 'activate']);

// Initialize the plugin
$threadwp_app->init();
