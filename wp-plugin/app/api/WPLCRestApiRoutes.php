<?php

namespace WPLCAPP\api;

use WP_REST_Server;

defined('ABSPATH') or die('Something went wrong');

class WPLCRestApiRoutes {

    /**
     * @var WPLCRestApiRoutes
     */
    private static $instance;

    /**
     * API namespace
     */
    private $namespace = 'wplc-chat/v1';

    /**
     * Controller instance
     */
    private $controller;

    /**
     * Get singleton instance
     */
    public static function instance() {
        if ( ! isset( self::$instance ) && ! ( self::$instance instanceof WPLCRestApiRoutes ) ) {
            self::$instance = new WPLCRestApiRoutes();
        }

        return self::$instance;
    }

    /**
     * Initialize routes
     */
    public function init() {
        $this->controller = WPLCRestApiController::instance();
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register all REST API routes
     */
    public function register_routes() {
        $this->register_threads_routes();
        $this->register_messages_routes();
        $this->register_attachments_routes();
        $this->register_typing_routes();
        $this->register_read_receipts_routes();
    }

    /**
     * Register threads endpoints
     */
    private function register_threads_routes() {
        register_rest_route($this->namespace, '/threads', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this->controller, 'get_threads'),
                'permission_callback' => array($this->controller, 'check_user_permissions'),
                'args' => array(
                    'page' => array(
                        'default' => 1,
                        'validate_callback' => function($param) {
                            return is_numeric($param) && $param > 0;
                        }
                    ),
                    'per_page' => array(
                        'default' => 20,
                        'validate_callback' => function($param) {
                            return is_numeric($param) && $param > 0 && $param <= 100;
                        }
                    ),
                    'search' => array(
                        'default' => '',
                        'validate_callback' => function($param) {
                            return is_string($param);
                        },
                        'sanitize_callback' => 'sanitize_text_field'
                    )
                )
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this->controller, 'create_thread'),
                'permission_callback' => array($this->controller, 'check_user_permissions'),
                'args' => array(
                    'type' => array(
                        'required' => true,
                        'validate_callback' => function($param) {
                            return in_array($param, array('private', 'group'));
                        },
                        'sanitize_callback' => 'sanitize_text_field'
                    ),
                    'title' => array(
                        'required' => false,
                        'validate_callback' => function($param) {
                            return is_string($param) && strlen($param) <= 255;
                        },
                        'sanitize_callback' => 'sanitize_text_field'
                    ),
                    'participants' => array(
                        'required' => false,
                        'validate_callback' => function($param) {
                            return is_array($param) && !empty($param);
                        },
                        'sanitize_callback' => function($param) {
                            return array_map('absint', $param);
                        }
                    )
                )
            )
        ));
    }

    /**
     * Register messages endpoints
     */
    private function register_messages_routes() {
        // Single thread messages endpoint
        register_rest_route($this->namespace, '/threads/(?P<thread_id>\d+)/messages', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this->controller, 'get_thread_messages'),
                'permission_callback' => array($this->controller, 'check_thread_access_permissions'),
                'args' => array(
                    'thread_id' => array(
                        'required' => true,
                        'validate_callback' => function($param) {
                            return is_numeric($param) && $param > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ),
                    'before' => array(
                        'default' => '',
                        'validate_callback' => function($param) {
                            return empty($param) || strtotime($param) !== false;
                        },
                        'sanitize_callback' => 'sanitize_text_field'
                    ),
                    'limit' => array(
                        'default' => 50,
                        'validate_callback' => function($param) {
                            return is_numeric($param) && $param > 0 && $param <= 100;
                        },
                        'sanitize_callback' => 'absint'
                    )
                )
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this->controller, 'send_message'),
                'permission_callback' => array($this->controller, 'check_thread_access_permissions'),
                'args' => array(
                    'thread_id' => array(
                        'required' => true,
                        'validate_callback' => function($param) {
                            return is_numeric($param) && $param > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ),
                    'content' => array(
                        'required' => true,
                        'validate_callback' => function($param) {
                            return is_string($param) && !empty(trim($param)) && strlen($param) <= 10000;
                        },
                        'sanitize_callback' => function($param) {
                            return wp_kses_post(trim($param));
                        }
                    ),
                    'content_type' => array(
                        'default' => 'text/plain',
                        'validate_callback' => function($param) {
                            return in_array($param, array('text/plain', 'text/markdown', 'reaction', 'system'));
                        },
                        'sanitize_callback' => 'sanitize_text_field'
                    ),
                    'attachment_ids' => array(
                        'default' => array(),
                        'validate_callback' => function($param) {
                            return is_array($param);
                        },
                        'sanitize_callback' => function($param) {
                            return array_map('absint', $param);
                        }
                    )
                )
            )
        ));
    }

    /**
     * Register attachments endpoints
     */
    private function register_attachments_routes() {
        // File upload endpoint
        register_rest_route($this->namespace, '/attachments', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this->controller, 'upload_attachment'),
            'permission_callback' => array($this->controller, 'check_user_permissions'),
            'args' => array(
                'file' => array(
                    'required' => true,
                    'validate_callback' => array($this->controller, 'validate_file_upload')
                )
            )
        ));
    }

    /**
     * Register typing indicator endpoints
     */
    private function register_typing_routes() {
        // Typing indicator endpoint
        register_rest_route($this->namespace, '/threads/(?P<thread_id>\d+)/typing', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this->controller, 'handle_typing_indicator'),
            'permission_callback' => array($this->controller, 'check_thread_access_permissions'),
            'args' => array(
                'thread_id' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                    'sanitize_callback' => 'absint'
                ),
                'is_typing' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_bool($param) || in_array($param, array('true', 'false', '1', '0'));
                    },
                    'sanitize_callback' => function($param) {
                        return filter_var($param, FILTER_VALIDATE_BOOLEAN);
                    }
                )
            )
        ));

        // Get typing status endpoint
        register_rest_route($this->namespace, '/threads/(?P<thread_id>\d+)/typing', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this->controller, 'get_typing_status_endpoint'),
            'permission_callback' => array($this->controller, 'check_thread_access_permissions'),
            'args' => array(
                'thread_id' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                    'sanitize_callback' => 'absint'
                )
            )
        ));
    }

    /**
     * Register read receipts endpoints
     */
    private function register_read_receipts_routes() {
        // Mark messages as read endpoint
        register_rest_route($this->namespace, '/threads/(?P<thread_id>\d+)/read', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this->controller, 'mark_messages_read'),
            'permission_callback' => array($this->controller, 'check_thread_access_permissions'),
            'args' => array(
                'thread_id' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                    'sanitize_callback' => 'absint'
                ),
                'message_id' => array(
                    'required' => false,
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                    'sanitize_callback' => 'absint'
                )
            )
        ));

        // Get read receipts for message endpoint
        register_rest_route($this->namespace, '/messages/(?P<message_id>\d+)/receipts', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this->controller, 'get_message_read_receipts'),
            'permission_callback' => array($this->controller, 'check_user_permissions'),
            'args' => array(
                'message_id' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                    'sanitize_callback' => 'absint'
                )
            )
        ));
    }
}
