<?php

namespace WPLCAPP\api;

use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use WPLCAPP\database\WPLCDatabaseManager;

defined('ABSPATH') or die('Something went wrong');

class WPLCRestApiController
{

    /**
     * @var WPLCRestApiController
     */
    private static $instance;

    /**
     * API namespace
     */
    private $namespace = 'wplc-chat/v1';

    /**
     * Get singleton instance
     */
    public static function instance()
    {
        if (!isset(self::$instance) && !(self::$instance instanceof WPLCRestApiController)) {
            self::$instance = new WPLCRestApiController();
        }

        return self::$instance;
    }

    /**
     * Initialize the REST API
     */
    public function init()
    {
        // Routes are now handled by WPLCRestApiRoutes
        WPLCRestApiRoutes::instance()->init();
    }

    /**
     * Check API key authentication for external access
     */
    public function check_api_key_authentication(WP_REST_Request $request)
    {
        // Check if API access is enabled
        if (!get_option('wplc_api_enabled', false)) {
            return false;
        }

        // Check for API key in header or query parameter
        $api_key = $request->get_header('X-WPLC-API-Key')
            ?? $request->get_param('api_key');

        if (!empty($api_key)) {
            $valid_api_key = get_option('wplc_api_key', '');

            if (!empty($valid_api_key) && hash_equals($valid_api_key, $api_key)) {
                // Set a pseudo user for API access (use admin user or create a system user)
                $api_user_id = get_option('wplc_api_user_id', 1); // Default to admin
                wp_set_current_user($api_user_id);
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has basic permissions to access chat API
     */
    public function check_user_permissions(WP_REST_Request $request)
    {
        // First try API key authentication
        if ($this->check_api_key_authentication($request)) {
            return true;
        }

        // Fall back to regular user authentication
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You are not currently logged in.', 'wp-live-chat-users'),
                array('status' => 401)
            );
        }

        $current_user = wp_get_current_user();

        // Check if user has capability to use chat
        if (!user_can($current_user, 'read')) {
            return new WP_Error(
                'rest_cannot_access_chat',
                __('Sorry, you are not allowed to access the chat.', 'wp-live-chat-users'),
                array('status' => 403)
            );
        }

        // Additional permission filters
        $has_permission = apply_filters('wplc_user_can_access_chat', true, $current_user, $request);

        if (!$has_permission) {
            return new WP_Error(
                'rest_chat_access_denied',
                __('Access to chat is denied.', 'wp-live-chat-users'),
                array('status' => 403)
            );
        }

        return true;
    }

    /**
     * Check if user has permission to access specific thread
     */
    public function check_thread_access_permissions(WP_REST_Request $request)
    {
        // First check basic user permissions
        $basic_check = $this->check_user_permissions($request);
        if (is_wp_error($basic_check)) {
            return $basic_check;
        }

        // If using API key, allow access to all threads (system-level access)
        if ($this->check_api_key_authentication($request)) {
            return true;
        }

        $thread_id = $request->get_param('thread_id');
        $current_user_id = get_current_user_id();

        if (!$this->user_can_access_thread($current_user_id, $thread_id)) {
            return new WP_Error(
                'rest_cannot_access_thread',
                __('Sorry, you are not allowed to access this thread.', 'wp-live-chat-users'),
                array('status' => 403)
            );
        }

        return true;
    }

    /**
     * Check if user can access a specific thread
     */
    private function user_can_access_thread($user_id, $thread_id)
    {
        global $wpdb;

        $thread_table = $wpdb->prefix . 'wplc_message_threads';
        $participants_table = $wpdb->prefix . 'wplc_message_participants';

        $sql = $wpdb->prepare(
            "
            SELECT t.*, p.role AS participant_role
            FROM {$thread_table} t
            LEFT JOIN {$participants_table} p
                ON t.id = p.thread_id
                AND p.user_id = %d
            WHERE t.id = %d
            ",
            $user_id,
            $thread_id
        );

        $result = $wpdb->get_row($sql);  // phpcs:ignore  WordPress.DB.PreparedSQL.NotPrepared 


        if (!$result) {
            return false;
        }

        // User is a participant
        if (!empty($result->participant_role)) {
            return true;
        }

        return false;
    }

    /**
     * Validate file upload
     */
    public function validate_file_upload($param, $request, $key)
    {
        $files = $request->get_file_params();

        if (empty($files['file'])) {
            return false;
        }

        $file = $files['file'];

        // Check file size (default 10MB)
        $max_size = apply_filters('wplc_max_file_size', 10 * 1024 * 1024);
        if ($file['size'] > $max_size) {
            return false;
        }

        // Check allowed file types
        $allowed_types = apply_filters('wplc_allowed_file_types', array(
            'jpg',
            'jpeg',
            'png',
            'gif',
            'pdf',
            'doc',
            'docx',
            'txt',
            'zip'
        ));

        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($file_extension, $allowed_types)) {
            return false;
        }

        return true;
    }

    /**
     * Get current user ID or return error
     */
    private function get_current_user_or_error()
    {
        $user_id = get_current_user_id();
        if (!$user_id) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You are not currently logged in.', 'wp-live-chat-users'),
                array('status' => 401)
            );
        }
        return $user_id;
    }

    /**
     * Sanitize and validate thread data
     */
    private function sanitize_thread_data($data)
    {
        return array(
            'type' => sanitize_text_field($data['type']),
            'title' => isset($data['title']) ? sanitize_text_field($data['title']) : null,
            'participants' => isset($data['participants']) ? array_map('absint', $data['participants']) : array()
        );
    }

    /**
     * Get threads for current user
     */
    public function get_threads(WP_REST_Request $request)
    {
        $user_id = $this->get_current_user_or_error();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        global $wpdb;

        // Sanitize input parameters
        $page = absint($request->get_param('page') ?: 1);
        $per_page = absint($request->get_param('per_page') ?: 20);
        $search = sanitize_text_field($request->get_param('search') ?: '');
        $offset = ($page - 1) * $per_page;

        // Get escaped table names
        $threads_table = esc_sql($wpdb->prefix . 'wplc_message_threads');
        $messages_table = esc_sql($wpdb->prefix . 'wplc_messages');
        $participants_table = esc_sql($wpdb->prefix . 'wplc_message_participants');
        $read_receipts_table = esc_sql($wpdb->prefix . 'wplc_message_read_receipts');
        $users_table = esc_sql($wpdb->users);

        // Build search query
        $search_sql = '';
        $search_params = array();
        if (!empty($search)) {
            $search_sql = ' AND (t.title LIKE %s OR u.display_name LIKE %s)';
            $search_params = array('%' . $wpdb->esc_like($search) . '%', '%' . $wpdb->esc_like($search) . '%');
        }

        $params = array_merge(array($user_id, $user_id, $user_id), $search_params, array($per_page, $offset));

        $base_query = "SELECT 
                t.*,
                u.display_name as created_by_name,
                u.user_email as created_by_email,
                lm.content as last_message_content,
                lm.created_at as last_message_time,
                lm.sender_id as last_message_sender_id,
                lmu.display_name as last_message_sender_name,
                (
                    SELECT COUNT(*) 
                    FROM `{$messages_table}` m2 
                    WHERE m2.thread_id = t.id 
                    AND m2.sender_id != %d
                    AND NOT EXISTS (
                        SELECT 1 FROM `{$read_receipts_table}` rr 
                        WHERE rr.message_id = m2.id 
                        AND rr.user_id = %d
                    )
                ) as unread_count
            FROM `{$threads_table}` t
            INNER JOIN `{$participants_table}` p ON t.id = p.thread_id AND p.user_id = %d
            LEFT JOIN `{$users_table}` u ON t.created_by = u.ID
            LEFT JOIN (
                SELECT m1.*
                FROM `{$messages_table}` m1
                INNER JOIN (
                    SELECT thread_id, MAX(created_at) as max_created_at
                    FROM `{$messages_table}`
                    GROUP BY thread_id
                ) m2 ON m1.thread_id = m2.thread_id AND m1.created_at = m2.max_created_at
            ) lm ON t.id = lm.thread_id
            LEFT JOIN `{$users_table}` lmu ON lm.sender_id = lmu.ID
            WHERE 1=1
            $search_sql
            ORDER BY COALESCE(lm.created_at, t.created_at) DESC
            LIMIT %d OFFSET %d";

        $threads = $wpdb->get_results($wpdb->prepare($base_query, $params));  // phpcs:ignore  WordPress.DB.PreparedSQL.NotPrepared 

        // Get total count for pagination
        $count_params = array_merge(array($user_id), $search_params);
        $base_count_query = "SELECT COUNT(DISTINCT t.id)
            FROM `{$threads_table}` t
            INNER JOIN `{$participants_table}` p ON t.id = p.thread_id AND p.user_id = %d
            LEFT JOIN `{$users_table}` u ON t.created_by = u.ID
            WHERE 1=1
            $search_sql";

        $total = $wpdb->get_var($wpdb->prepare($base_count_query, $count_params));   // phpcs:ignore  WordPress.DB.PreparedSQL.NotPrepared 

        // Format response
        $formatted_threads = array();
        foreach ($threads as $thread) {
            $formatted_threads[] = $this->format_thread_response($thread);
        }

        return new WP_REST_Response(array(
            'threads' => $formatted_threads,
            'pagination' => array(
                'page' => $page,
                'per_page' => $per_page,
                'total' => (int) $total,
                'total_pages' => ceil($total / $per_page)
            )
        ), 200);
    }

    /**
     * Create a new thread
     */
    public function create_thread(WP_REST_Request $request)
    {
        $user_id = $this->get_current_user_or_error();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        global $wpdb;

        $data = $this->sanitize_thread_data($request->get_params());

        // Validate participants array
        if (empty($data['participants']) || !is_array($data['participants'])) {
            return new WP_Error(
                'invalid_participants',
                __('Participants must be provided as an array of user IDs.', 'wp-live-chat-users'),
                array('status' => 400)
            );
        }

        // Remove duplicates from participants array
        $data['participants'] = array_unique(array_map('intval', $data['participants']));

        // Verify all participants exist and can access chat
        foreach ($data['participants'] as $participant_id) {
            $participant = get_user_by('ID', $participant_id);
            if (!$participant || !user_can($participant_id, 'read')) {
                return new WP_Error(
                    'invalid_participant',
                    /* translators: %d: participant ID */
                    sprintf(__('Invalid participant ID: %d', 'wp-live-chat-users'), $participant_id),
                    array('status' => 400)
                );
            }
        }

        // Validate based on thread type
        if ($data['type'] === 'private') {
            // Private chats must have exactly one other participant
            if (count($data['participants']) < 2) {
                return new WP_Error(
                    'invalid_participants_count',
                    __('Private chats must have exactly one other participant.', 'wp-live-chat-users'),
                    array('status' => 400)
                );
            }

            // Check if private thread already exists
            $other_user_id = $data['participants'][0];
            $existing_thread = $this->find_private_thread($user_id, $other_user_id);
            if ($existing_thread) {
                return new WP_REST_Response(array(
                    'thread' => $this->format_thread_response($existing_thread),
                    'message' => __('Thread already exists.', 'wp-live-chat-users')
                ), 200);
            }
        } else {
            // Group chats require at least one other participant
            if (count($data['participants']) < 1) {
                return new WP_Error(
                    'invalid_participants_count',
                    __('Group chats must have at least one participant.', 'wp-live-chat-users'),
                    array('status' => 400)
                );
            }
        }

        $threads_table = esc_sql($wpdb->prefix . 'wplc_message_threads');

        $insert_data = array(
            'type' => $data['type'],
            'title' => $data['title'],
            'created_by' => $user_id,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );

        $result = $wpdb->insert($threads_table, $insert_data);

        if ($result === false) {
            return new WP_Error(
                'thread_creation_failed',
                __('Failed to create thread.', 'wp-live-chat-users'),
                array('status' => 500)
            );
        }

        $thread_id = $wpdb->insert_id;

        // Add thread participants
        $participants_table = esc_sql($wpdb->prefix . 'wplc_message_participants');

        // Add creator as owner
        $wpdb->insert($participants_table, array(
            'thread_id' => $thread_id,
            'user_id' => $user_id,
            'role' => 'owner',
            'joined_at' => current_time('mysql')
        ));

        // Add other participants
        foreach ($data['participants'] as $participant_id) {
            // Skip if this is the thread creator (already added as owner)
            if ($participant_id == $user_id) {
                continue;
            }

            // Check if participant is already added
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM `{$participants_table}` WHERE thread_id = %d AND user_id = %d",
                $thread_id,
                $participant_id
            ));

            if ($exists) {
                continue;
            }

            $result = $wpdb->insert($participants_table, array(
                'thread_id' => $thread_id,
                'user_id' => $participant_id,
                'role' => 'member',
                'joined_at' => current_time('mysql')
            ));

            if ($result === false) {
                // Clean up the thread and its participants if insertion fails
                $wpdb->delete($participants_table, array('thread_id' => $thread_id));
                $wpdb->delete($threads_table, array('id' => $thread_id));

                return new WP_Error(
                    'participant_creation_failed',
                    /* translators: %d: participant ID */
                    sprintf(__('Failed to add participant: %d', 'wp-live-chat-users'), $participant_id),
                    array('status' => 500)
                );
            }
        }

        // Get the created thread with participants
        $thread = $wpdb->get_row($wpdb->prepare(
            "SELECT t.*, u.display_name as created_by_name, u.user_email as created_by_email 
             FROM `{$threads_table}` t 
             LEFT JOIN `{$wpdb->users}` u ON t.created_by = u.ID 
             WHERE t.id = %d",
            $thread_id
        ));

        $formatted_thread = $this->format_thread_response($thread);

        // Notify all participants about the new thread via webhook
        $this->send_socket_webhook('thread-created', array(
            'thread' => $formatted_thread,
            'participantIds' => $data['participants'],
            'event' => 'thread_created'
        ));

        return new WP_REST_Response(array(
            'thread' => $formatted_thread,
            'message' => __('Thread created successfully.', 'wp-live-chat-users')
        ), 201);
    }

    /**
     * Get thread participants
     */
    public function get_thread_participants(WP_REST_Request $request)
    {
        $thread_id = $request->get_param('thread_id');

        global $wpdb;
        $participants_table = esc_sql($wpdb->prefix . 'wplc_message_participants');
        $users_table = esc_sql($wpdb->users);

        $participants = $wpdb->get_results($wpdb->prepare(
            "SELECT p.*, u.display_name, u.user_email 
            FROM `{$participants_table}` p
            LEFT JOIN `{$users_table}` u ON p.user_id = u.ID
            WHERE p.thread_id = %d
            ORDER BY p.role = 'owner' DESC, p.role = 'admin' DESC, p.joined_at ASC",
            $thread_id
        ));

        return new WP_REST_Response(array(
            'participants' => array_map(function ($participant) {
                return array(
                    'id' => $participant->user_id,
                    'name' => $participant->display_name,
                    'email' => $participant->user_email,
                    'role' => $participant->role,
                    'joined_at' => $participant->joined_at
                );
            }, $participants)
        ), 200);
    }

    /**
     * Add participant to thread
     */
    public function add_thread_participant(WP_REST_Request $request)
    {
        $thread_id = $request->get_param('thread_id');
        $user_id = $request->get_param('user_id');
        $role = $request->get_param('role') ?? 'member';

        // Validate role
        if (!in_array($role, ['member', 'admin'])) {
            return new WP_Error(
                'invalid_role',
                __('Invalid participant role.', 'wp-live-chat-users'),
                array('status' => 400)
            );
        }

        global $wpdb;
        $participants_table = $wpdb->prefix . 'wplc_message_participants';

        // Check if already a participant
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM `{$participants_table}` WHERE thread_id = %d AND user_id = %d",
            $thread_id,
            $user_id
        ));

        if ($existing) {
            return new WP_Error(
                'already_participant',
                __('User is already a participant in this thread.', 'wp-live-chat-users'),
                array('status' => 400)
            );
        }

        // Add participant
        $result = $wpdb->insert($participants_table, array(
            'thread_id' => $thread_id,
            'user_id' => $user_id,
            'role' => $role,
            'joined_at' => current_time('mysql')
        ));

        if ($result === false) {
            return new WP_Error(
                'add_participant_failed',
                __('Failed to add participant.', 'wp-live-chat-users'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'message' => __('Participant added successfully.', 'wp-live-chat-users')
        ), 201);
    }

    /**
     * Update participant role
     */
    public function update_participant_role(WP_REST_Request $request)
    {
        $thread_id = $request->get_param('thread_id');
        $user_id = $request->get_param('user_id');
        $new_role = $request->get_param('role');

        // Validate role
        if (!in_array($new_role, ['member', 'admin'])) {
            return new WP_Error(
                'invalid_role',
                __('Invalid participant role.', 'wp-live-chat-users'),
                array('status' => 400)
            );
        }

        global $wpdb;
        $participants_table = $wpdb->prefix . 'wplc_message_participants';

        // Cannot modify owner role
        $participant = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM `{$participants_table}` WHERE thread_id = %d AND user_id = %d",
            $thread_id,
            $user_id
        ));

        if (!$participant) {
            return new WP_Error(
                'participant_not_found',
                __('Participant not found.', 'wp-live-chat-users'),
                array('status' => 404)
            );
        }

        if ($participant->role === 'owner') {
            return new WP_Error(
                'cannot_modify_owner',
                __('Cannot modify the owner role.', 'wp-live-chat-users'),
                array('status' => 400)
            );
        }

        // Update role
        $result = $wpdb->update(
            $participants_table,
            array('role' => $new_role),
            array('thread_id' => $thread_id, 'user_id' => $user_id)
        );

        if ($result === false) {
            return new WP_Error(
                'update_role_failed',
                __('Failed to update participant role.', 'wp-live-chat-users'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'message' => __('Participant role updated successfully.', 'wp-live-chat-users')
        ), 200);
    }

    /**
     * Remove participant from thread
     */
    public function remove_thread_participant(WP_REST_Request $request)
    {
        $thread_id = $request->get_param('thread_id');
        $user_id = $request->get_param('user_id');

        global $wpdb;
        $participants_table = $wpdb->prefix . 'wplc_message_participants';

        // Cannot remove owner
        $participant = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM `{$participants_table}` WHERE thread_id = %d AND user_id = %d",
            $thread_id,
            $user_id
        ));

        if (!$participant) {
            return new WP_Error(
                'participant_not_found',
                __('Participant not found.', 'wp-live-chat-users'),
                array('status' => 404)
            );
        }

        if ($participant->role === 'owner') {
            return new WP_Error(
                'cannot_remove_owner',
                __('Cannot remove the thread owner.', 'wp-live-chat-users'),
                array('status' => 400)
            );
        }

        // Remove participant
        $result = $wpdb->delete(
            $participants_table,
            array('thread_id' => $thread_id, 'user_id' => $user_id)
        );

        if ($result === false) {
            return new WP_Error(
                'remove_participant_failed',
                __('Failed to remove participant.', 'wp-live-chat-users'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'message' => __('Participant removed successfully.', 'wp-live-chat-users')
        ), 200);
    }

    /**
     * Get messages for a thread
     */
    public function get_thread_messages(WP_REST_Request $request)
    {
        $thread_id = $request->get_param('thread_id');
        $before = $request->get_param('before');
        $limit = $request->get_param('limit');
        $current_user_id = get_current_user_id();

        global $wpdb;

        $messages_table = esc_sql($wpdb->prefix . 'wplc_messages');
        $attachments_table = esc_sql($wpdb->prefix . 'wplc_message_attachments');
        $read_receipts_table = esc_sql($wpdb->prefix . 'wplc_message_read_receipts');
        $users_table = esc_sql($wpdb->users);

        // Build query
        $where_clause = 'WHERE m.thread_id = %d';
        $params = array($thread_id);

        if (!empty($before)) {
            $where_clause .= ' AND m.created_at < %s';
            $params[] = $before;
        }

        $base_query = "SELECT 
                m.*,
                u.display_name as sender_name,
                u.user_email as sender_email
            FROM `{$messages_table}` m
            LEFT JOIN `{$users_table}` u ON m.sender_id = u.ID
            $where_clause
            ORDER BY m.created_at DESC
            LIMIT %d";

        $messages = $wpdb->get_results($wpdb->prepare($base_query, array_merge($params, array($limit))));  // phpcs:ignore  WordPress.DB.PreparedSQL.NotPrepared 

        // Get attachments for messages
        if (!empty($messages)) {
            $message_ids = array_column($messages, 'id');
            $placeholders = implode(',', array_fill(0, count($message_ids), '%d'));
            $attachment_query = "SELECT * FROM `{$attachments_table}` WHERE message_id IN ($placeholders)";
            $attachments = $wpdb->get_results($wpdb->prepare($attachment_query, ...$message_ids));  // phpcs:ignore  WordPress.DB.PreparedSQL.NotPrepared 

            // Group attachments by message_id
            $attachments_by_message = array();
            foreach ($attachments as $attachment) {
                $attachments_by_message[$attachment->message_id][] = $attachment;
            }
        }

        // Get read receipts for all messages
        $read_receipts = array();
        if (!empty($messages)) {
            $message_ids = array_column($messages, 'id');
            $placeholders = implode(',', array_fill(0, count($message_ids), '%d'));
            $receipts_query = "SELECT message_id, user_id, delivered_at, read_at 
                 FROM `{$read_receipts_table}` 
                 WHERE message_id IN ($placeholders)";
            $receipts = $wpdb->get_results($wpdb->prepare($receipts_query, ...$message_ids));  // phpcs:ignore  WordPress.DB.PreparedSQL.NotPrepared 

            // Group receipts by message_id
            foreach ($receipts as $receipt) {
                if (!isset($read_receipts[$receipt->message_id])) {
                    $read_receipts[$receipt->message_id] = array();
                }
                $read_receipts[$receipt->message_id][] = $receipt;
            }
        }

        // Format response
        $formatted_messages = array();
        foreach (array_reverse($messages) as $message) { // Reverse to show oldest first
            $formatted_message = $this->format_message_response($message, $current_user_id);

            // Calculate delivery and read status for sender's own messages
            if ($message->sender_id == $current_user_id && isset($read_receipts[$message->id])) {
                $receipts = $read_receipts[$message->id];
                $all_delivered = true;
                $all_read = true;
                $any_delivered = false;
                $any_read = false;

                foreach ($receipts as $receipt) {
                    if ($receipt->delivered_at) {
                        $any_delivered = true;
                    } else {
                        $all_delivered = false;
                    }

                    if ($receipt->read_at) {
                        $any_read = true;
                    } else {
                        $all_read = false;
                    }
                }

                // Set status based on receipts
                if ($all_read) {
                    $formatted_message['status'] = 'read';
                } elseif ($any_read || $all_delivered) {
                    $formatted_message['status'] = 'delivered';
                } elseif ($any_delivered) {
                    $formatted_message['status'] = 'delivered';
                } else {
                    $formatted_message['status'] = 'sent';
                }
            }

            // Add attachments if any
            if (isset($attachments_by_message[$message->id])) {
                $formatted_message['attachments'] = array_map(
                    array($this, 'format_attachment_response'),
                    $attachments_by_message[$message->id]
                );
            }

            $formatted_messages[] = $formatted_message;
        }

        return new WP_REST_Response(array(
            'messages' => $formatted_messages,
            'has_more' => count($messages) === $limit
        ), 200);
    }

    /**
     * Send a message to a thread
     */
    public function send_message(WP_REST_Request $request)
    {
        $user_id = $this->get_current_user_or_error();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // If using API key authentication, allow sender_id to be specified
        $sender_id = $user_id;
        if ($this->check_api_key_authentication($request)) {
            $requested_sender_id = $request->get_param('sender_id');
            if (!empty($requested_sender_id)) {
                // Validate that the sender user exists
                $sender_user = get_user_by('ID', $requested_sender_id);
                if ($sender_user) {
                    $sender_id = intval($requested_sender_id);
                }
            }
        }

        // Check rate limiting
        $rate_check = $this->check_rate_limit($sender_id, 'message');
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $thread_id = $request->get_param('thread_id');
        $content = $request->get_param('content');
        $content_type = $request->get_param('content_type');
        $attachment_ids = $request->get_param('attachment_ids');

        // Validate message content
        $content_validation = $this->validate_message_content($content, $content_type);
        if (is_wp_error($content_validation)) {
            return $content_validation;
        }

        global $wpdb;

        $messages_table = esc_sql($wpdb->prefix . 'wplc_messages');
        $threads_table = esc_sql($wpdb->prefix . 'wplc_message_threads');

        // Insert message
        $message_data = array(
            'thread_id' => $thread_id,
            'sender_id' => $sender_id,
            'content' => $content,
            'content_type' => $content_type,
            'status' => 'sent',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );

        $result = $wpdb->insert($messages_table, $message_data);
        if ($result === false) {
            return new WP_Error(
                'message_send_failed',
                __('Failed to send message.', 'wp-live-chat-users'),
                array('status' => 500)
            );
        }

        $message_id = $wpdb->insert_id;

        // Handle attachments
        if (!empty($attachment_ids)) {
            $this->attach_files_to_message($message_id, $attachment_ids);
        }

        // Update thread timestamp
        $wpdb->update(
            $threads_table,
            array('updated_at' => current_time('mysql')),
            array('id' => $thread_id)
        );

        // Get the complete message
        $message = $wpdb->get_row($wpdb->prepare(
            "SELECT m.*, u.display_name as sender_name, u.user_email as sender_email 
             FROM `$messages_table` m 
             LEFT JOIN `{$wpdb->users}` u ON m.sender_id = u.ID 
             WHERE m.id = %d",
            $message_id
        ));

        $formatted_message = $this->format_message_response($message);

        // Add attachments if any
        if (!empty($attachment_ids)) {
            $attachments_table = $wpdb->prefix . 'wplc_message_attachments';
            $attachments = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM `$attachments_table` WHERE message_id = %d",
                $message_id
            ));

            $formatted_message['attachments'] = array_map(
                array($this, 'format_attachment_response'),
                $attachments
            );
        }

        // Create delivered receipts for all thread participants except sender
        $participants_table = $wpdb->prefix . 'wplc_message_participants';
        $read_receipts_table = $wpdb->prefix . 'wplc_message_read_receipts';

        $participants = $wpdb->get_results($wpdb->prepare(
            "SELECT user_id FROM `{$participants_table}` WHERE thread_id = %d AND user_id != %d",
            $thread_id,
            $sender_id
        ));

        $current_time = current_time('mysql');
        foreach ($participants as $participant) {
            // Create a receipt with delivered_at timestamp (read_at will be null until they read it)
            $wpdb->insert($read_receipts_table, array(
                'message_id' => $message_id,
                'user_id' => $participant->user_id,
                'delivered_at' => $current_time,
                'read_at' => null
            ));
        }

        // Fire action for real-time notifications
        do_action('wplc_message_sent', $message, $thread_id);

        // Send webhook to socket server for real-time updates
        $this->send_socket_webhook('message', array(
            'message' => $formatted_message,
            'threadId' => $thread_id,
            'senderId' => $sender_id,
            'event' => 'message_sent'
        ));

        return new WP_REST_Response(array(
            'message' => $formatted_message,
            'success' => true
        ), 201);
    }

    /**
     * Upload file attachment
     */
    public function upload_attachment(WP_REST_Request $request)
    {
        $user_id = $this->get_current_user_or_error();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // Check rate limiting
        $rate_check = $this->check_rate_limit($user_id, 'upload');
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $files = $request->get_file_params();

        if (empty($files['file'])) {
            return new WP_Error(
                'no_file',
                __('No file was uploaded.', 'wp-live-chat-users'),
                array('status' => 400)
            );
        }

        // Handle file upload
        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        $upload_overrides = array(
            'test_form' => false,
            'mimes' => apply_filters('wplc_upload_mimes', array(
                'jpg|jpeg|jpe' => 'image/jpeg',
                'gif' => 'image/gif',
                'png' => 'image/png',
                'pdf' => 'application/pdf',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'txt' => 'text/plain',
                'zip' => 'application/zip'
            ))
        );

        $movefile = wp_handle_upload($files['file'], $upload_overrides);

        if ($movefile && !isset($movefile['error'])) {
            // Store attachment info in database
            global $wpdb;
            $attachments_table = $wpdb->prefix . 'wplc_message_attachments';

            $attachment_data = array(
                'message_id' => 0, // Will be updated when attached to message
                'file_path' => $movefile['file'],
                'mime_type' => $movefile['type'],
                'file_size' => filesize($movefile['file']),
                'original_name' => $files['file']['name'],
                'created_at' => current_time('mysql')
            );

            $result = $wpdb->insert($attachments_table, $attachment_data);

            if ($result === false) {
                // Clean up uploaded file
                wp_delete_file($movefile['file']);
                return new WP_Error(
                    'attachment_save_failed',
                    __('Failed to save attachment information.', 'wp-live-chat-users'),
                    array('status' => 500)
                );
            }

            $attachment_id = $wpdb->insert_id;

            return new WP_REST_Response(array(
                'attachment_id' => $attachment_id,
                'url' => $movefile['url'],
                'filename' => $files['file']['name'],
                'size' => $attachment_data['file_size'],
                'mime_type' => $attachment_data['mime_type']
            ), 201);

        } else {
            return new WP_Error(
                'upload_failed',
                isset($movefile['error']) ? $movefile['error'] : __('File upload failed.', 'wp-live-chat-users'),
                array('status' => 500)
            );
        }
    }

    /**
     * Handle typing indicator
     */
    public function handle_typing_indicator(WP_REST_Request $request)
    {
        $user_id = $this->get_current_user_or_error();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // Check rate limiting
        $rate_check = $this->check_rate_limit($user_id, 'typing');
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $thread_id = $request->get_param('thread_id');
        $is_typing = $request->get_param('is_typing');

        // Store typing status in transient (expires in 10 seconds)
        $transient_key = "wplc_typing_{$thread_id}_{$user_id}";

        if ($is_typing) {
            set_transient($transient_key, true, 10);
        } else {
            delete_transient($transient_key);
        }

        // Fire action for real-time updates
        do_action('wplc_typing_indicator', $thread_id, $user_id, $is_typing);

        return new WP_REST_Response(array(
            'success' => true,
            'thread_id' => $thread_id,
            'is_typing' => $is_typing
        ), 200);
    }

    /**
     * Mark messages as read
     */
    public function mark_messages_read(WP_REST_Request $request)
    {
        $user_id = $this->get_current_user_or_error();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $thread_id = $request->get_param('thread_id');
        $message_id = $request->get_param('message_id');

        global $wpdb;

        $messages_table = $wpdb->prefix . 'wplc_messages';
        $read_receipts_table = $wpdb->prefix . 'wplc_message_read_receipts';

        // If specific message_id provided, mark only that message
        // Otherwise mark all messages in thread as read
        if ($message_id) {
            $messages_to_mark = array($message_id);
        } else {
            $messages_to_mark = $wpdb->get_col($wpdb->prepare(
                "SELECT id FROM `{$messages_table}` WHERE thread_id = %d AND sender_id != %d",
                $thread_id,
                $user_id
            ));
        }

        $marked_count = 0;
        $current_time = current_time('mysql');

        foreach ($messages_to_mark as $msg_id) {
            // Check if receipt already exists
            $existing = $wpdb->get_row($wpdb->prepare(
                "SELECT id, delivered_at, read_at FROM `{$read_receipts_table}` WHERE message_id = %d AND user_id = %d",
                $msg_id,
                $user_id
            ));

            if (!$existing) {
                // Create new receipt with both delivered and read timestamps
                $result = $wpdb->insert($read_receipts_table, array(
                    'message_id' => $msg_id,
                    'user_id' => $user_id,
                    'delivered_at' => $current_time,
                    'read_at' => $current_time
                ));

                if ($result) {
                    $marked_count++;
                }
            } elseif (!$existing->read_at) {
                // Update existing receipt to mark as read (and delivered if not already)
                $update_data = array('read_at' => $current_time);
                if (!$existing->delivered_at) {
                    $update_data['delivered_at'] = $current_time;
                }

                $wpdb->update(
                    $read_receipts_table,
                    $update_data,
                    array('id' => $existing->id)
                );
                $marked_count++;
            }
        }

        // Send webhook to socket server for read receipts
        if ($marked_count > 0) {
            $this->send_socket_webhook('read-receipt', array(
                'userId' => $user_id,
                'threadId' => $thread_id,
                'messageIds' => $messages_to_mark,
                'event' => 'messages_read'
            ));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'marked_count' => $marked_count
        ), 200);
    }

    /**
     * Send webhook notification to socket server
     */
    private function send_socket_webhook($endpoint, $data)
    {
        // Get socket server URL from settings
        $socket_url = get_option('wplc_socket_server_url', 'http://localhost:3001');

        // Don't send if socket server is not configured
        if (empty($socket_url) || $socket_url === 'http://localhost:3001') {
            // Skip in development if not configured
            return false;
        }

        $webhook_url = trailingslashit($socket_url) . 'webhook/' . $endpoint;

        // Send async request (non-blocking)
        $args = array(
            'body' => json_encode($data),
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'timeout' => 2, // Short timeout to avoid blocking
            'blocking' => false, // Non-blocking request
            'sslverify' => false // For local development
        );

        wp_remote_post($webhook_url, $args);

        return true;
    }

    /**
     * Format thread response
     */
    private function format_thread_response($thread)
    {
        global $wpdb;

        // Get participants for this thread
        $participants_table = $wpdb->prefix . 'wplc_message_participants';
        $participants_query = "SELECT p.user_id, u.display_name, u.user_email
            FROM `{$participants_table}` p
            LEFT JOIN `{$wpdb->users}` u ON p.user_id = u.ID
            WHERE p.thread_id = %d";
        $participants = $wpdb->get_results($wpdb->prepare($participants_query, $thread->id));  // phpcs:ignore  WordPress.DB.PreparedSQL.NotPrepared 

        $formatted_participants = array();
        foreach ($participants as $participant) {
            $formatted_participants[] = array(
                'user_id' => (int) $participant->user_id,
                'display_name' => $participant->display_name,
                'email' => $participant->user_email
            );
        }

        return array(
            'id' => (int) $thread->id,
            'type' => $thread->type,
            'title' => $thread->title,
            'created_by' => (int) $thread->created_by,
            'created_by_name' => $thread->created_by_name ?? '',
            'created_by_email' => $thread->created_by_email ?? '',
            'created_at' => $thread->created_at,
            'updated_at' => $thread->updated_at,
            'participants' => $formatted_participants,
            'last_message' => array(
                'content' => $thread->last_message_content ?? '',
                'created_at' => $thread->last_message_time ?? '',
                'sender_id' => isset($thread->last_message_sender_id) ? (int) $thread->last_message_sender_id : null,
                'sender_name' => $thread->last_message_sender_name ?? ''
            ),
            'unread_count' => isset($thread->unread_count) ? (int) $thread->unread_count : 0
        );
    }

    /**
     * Format message response
     */
    private function format_message_response($message, $current_user_id = null)
    {
        return array(
            'id' => (int) $message->id,
            'thread_id' => (int) $message->thread_id,
            'sender_id' => (int) $message->sender_id,
            'sender_name' => $message->sender_name ?? '',
            'sender_email' => $message->sender_email ?? '',
            'content' => $message->content,
            'content_type' => $message->content_type,
            'status' => $message->status,
            'created_at' => $message->created_at,
            'updated_at' => $message->updated_at,
            'attachments' => array() // Will be populated by caller if needed
        );
    }

    /**
     * Format attachment response
     */
    private function format_attachment_response($attachment)
    {
        $upload_dir = wp_upload_dir();
        $file_url = str_replace($upload_dir['basedir'], $upload_dir['baseurl'], $attachment->file_path);

        return array(
            'id' => (int) $attachment->id,
            'filename' => $attachment->original_name,
            'url' => $file_url,
            'mime_type' => $attachment->mime_type,
            'size' => (int) $attachment->file_size,
            'created_at' => $attachment->created_at
        );
    }

    /**
     * Get users that can participate in chat
     */
    public function get_users(WP_REST_Request $request)
    {
        // Get the current user
        $current_user = wp_get_current_user();
        if (!$current_user || !$current_user->ID) {
            return new WP_Error(
                'rest_forbidden',
                __('You must be logged in to access this endpoint.', 'wp-live-chat-users'),
                array('status' => 401)
            );
        }

        // Get query parameters
        $exclude = $request->get_param('exclude');
        $include = $request->get_param('include');
        $per_page = $request->get_param('per_page');
        $search = $request->get_param('search');
        $role = $request->get_param('role');

        // Set up the query args
        $args = array(
            'number' => $per_page,
            'orderby' => 'display_name',
            'order' => 'ASC',
            'fields' => 'all_with_meta'
        );

        // Add search if provided
        if (!empty($search)) {
            $args['search'] = '*' . $search . '*';
            $args['search_columns'] = array('user_login', 'user_nicename', 'user_email', 'display_name');
        }

        // Add role if provided
        if (!empty($role)) {
            $args['role'] = $role;
        }

        // Add exclude list
        if (!empty($exclude)) {
            $args['exclude'] = $exclude;
        }

        // Add include list
        if (!empty($include)) {
            $args['include'] = $include;
        }

        // Get users who can access chat
        $args = apply_filters('wplc_user_query_args', $args);
        $users = get_users($args);

        // Format the response
        $formatted_users = array();
        foreach ($users as $user) {
            // Skip if user doesn't have permission to use chat
            if (!user_can($user->ID, 'read')) {
                continue;
            }

            // Get avatar URL
            $avatar_url = get_avatar_url($user->ID, array('size' => 96));

            $user_data = array(
                'id' => $user->ID,
                'name' => $user->display_name,
                'username' => $user->user_login,
                'avatar_url' => $avatar_url,
                'roles' => $user->roles,
                'capabilities' => array_keys(array_filter($user->allcaps)),
                'last_active' => get_user_meta($user->ID, 'last_active', true),
                'is_online' => $this->is_user_online($user->ID)
            );

            // Allow plugins to modify user data
            $user_data = apply_filters('wplc_user_response_data', $user_data, $user);

            $formatted_users[] = $user_data;
        }

        return new WP_REST_Response($formatted_users, 200);
    }

    /**
     * Check if a user is currently online
     */
    private function is_user_online($user_id)
    {
        $last_active = get_user_meta($user_id, 'last_active', true);
        if (empty($last_active)) {
            return false;
        }

        // Consider user online if active in the last 5 minutes
        $online_threshold = 5 * MINUTE_IN_SECONDS;
        return (time() - intval($last_active)) < $online_threshold;
    }

    /**
     * Find existing private thread between two users
     */
    private function find_private_thread($user1_id, $user2_id)
    {
        global $wpdb;

        $threads_table = $wpdb->prefix . 'wplc_message_threads';
        $participants_table = $wpdb->prefix . 'wplc_message_participants';

        // Find threads where exactly these two users are participants
        return $wpdb->get_row($wpdb->prepare(
            "SELECT t.*, u.display_name as created_by_name, u.user_email as created_by_email 
            FROM `{$threads_table}` t
            INNER JOIN `{$participants_table}` p1 ON t.id = p1.thread_id
            INNER JOIN `{$participants_table}` p2 ON t.id = p2.thread_id
            LEFT JOIN `{$wpdb->users}` u ON t.created_by = u.ID
            WHERE t.type = 'private'
            AND (
                (p1.user_id = %d AND p2.user_id = %d)
            )
            AND NOT EXISTS (
                SELECT 1 
                FROM `{$participants_table}` p3 
                WHERE p3.thread_id = t.id 
                AND p3.user_id NOT IN (%d, %d)
            )
            LIMIT 1",
            $user1_id,
            $user2_id,
            $user1_id,
            $user2_id
        ));

    }

    /**
     * Attach files to message
     */
    private function attach_files_to_message($message_id, $attachment_ids)
    {
        global $wpdb;

        $attachments_table = $wpdb->prefix . 'wplc_message_attachments';

        foreach ($attachment_ids as $attachment_id) {
            $wpdb->update(
                $attachments_table,
                array('message_id' => $message_id),
                array('id' => $attachment_id),
                array('%d'),
                array('%d')
            );
        }
    }

    /**
     * Get typing status for thread
     */
    public function get_typing_status($thread_id)
    {
        global $wpdb;

        $typing_users = array();

        // Get all transients for this thread
        $transient_prefix = "wplc_typing_{$thread_id}_";
        $transients = $wpdb->get_results($wpdb->prepare(
            "SELECT option_name FROM `{$wpdb->options}` WHERE option_name LIKE %s",
            '_transient_' . $transient_prefix . '%'
        ));

        foreach ($transients as $transient) {
            $user_id = str_replace('_transient_' . $transient_prefix, '', $transient->option_name);
            if (is_numeric($user_id)) {
                $user = get_user_by('id', $user_id);
                if ($user) {
                    $typing_users[] = array(
                        'id' => (int) $user_id,
                        'name' => $user->display_name
                    );
                }
            }
        }

        return $typing_users;
    }

    /**
     * Validate message content
     */
    private function validate_message_content($content, $content_type)
    {
        if (empty(trim($content))) {
            return new WP_Error(
                'empty_content',
                __('Message content cannot be empty.', 'wp-live-chat-users'),
                array('status' => 400)
            );
        }

        // Content length validation
        $max_length = apply_filters('wplc_max_message_length', 10000);
        if (strlen($content) > $max_length) {
            return new WP_Error(
                'content_too_long',
                /* translators: %d: maximum number of characters */
                sprintf(__('Message content cannot exceed %d characters.', 'wp-live-chat-users'), $max_length),
                array('status' => 400)
            );
        }

        // Additional validation based on content type
        if ($content_type === 'reaction') {
            // Validate emoji/reaction format
            if (!preg_match('/^[\p{So}\p{Sk}]{1,5}$/u', $content)) {
                return new WP_Error(
                    'invalid_reaction',
                    __('Invalid reaction format.', 'wp-live-chat-users'),
                    array('status' => 400)
                );
            }
        }

        return true;
    }

    /**
     * Check rate limiting
     */
    private function check_rate_limit($user_id, $action = 'message')
    {
        $limit_key = "wplc_rate_limit_{$action}_{$user_id}";
        $current_count = get_transient($limit_key);

        $limits = apply_filters('wplc_rate_limits', array(
            'message' => array('count' => 60, 'period' => 60), // 60 messages per minute
            'upload' => array('count' => 10, 'period' => 60),  // 10 uploads per minute
            'typing' => array('count' => 30, 'period' => 60)   // 30 typing updates per minute
        ));

        if (!isset($limits[$action])) {
            return true;
        }

        $limit = $limits[$action];

        if ($current_count === false) {
            set_transient($limit_key, 1, $limit['period']);
            return true;
        }

        if ($current_count >= $limit['count']) {
            return new WP_Error(
                'rate_limit_exceeded',
                /* translators: 1: maximum count, 2: action name, 3: period in seconds */
                sprintf(
                    __('Rate limit exceeded. Maximum %1$d %2$s per %3$d seconds.', 'wp-live-chat-users'),
                    $limit['count'],
                    $action,
                    $limit['period']
                ),
                array('status' => 429)
            );
        }

        set_transient($limit_key, $current_count + 1, $limit['period']);
        return true;
    }

    /**
     * Get typing status for thread (endpoint wrapper)
     */
    public function get_typing_status_endpoint(WP_REST_Request $request)
    {
        $thread_id = $request->get_param('thread_id');
        $typing_users = $this->get_typing_status($thread_id);

        return new WP_REST_Response(array(
            'thread_id' => $thread_id,
            'typing_users' => $typing_users
        ), 200);
    }

    /**
     * Get read receipts for a message
     */
    public function get_message_read_receipts(WP_REST_Request $request)
    {
        $user_id = $this->get_current_user_or_error();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $message_id = $request->get_param('message_id');

        global $wpdb;

        $read_receipts_table = $wpdb->prefix . 'wplc_message_read_receipts';
        $messages_table = $wpdb->prefix . 'wplc_messages';

        // First check if user has access to this message
        $message = $wpdb->get_row($wpdb->prepare(
            "SELECT thread_id FROM `{$messages_table}` WHERE id = %d",
            $message_id
        ));

        if (!$message) {
            return new WP_Error(
                'message_not_found',
                __('Message not found.', 'wp-live-chat-users'),
                array('status' => 404)
            );
        }

        // Check thread access
        if (!$this->user_can_access_thread($user_id, $message->thread_id)) {
            return new WP_Error(
                'rest_cannot_access_thread',
                __('Sorry, you are not allowed to access this thread.', 'wp-live-chat-users'),
                array('status' => 403)
            );
        }

        // Get read receipts
        $receipts = $wpdb->get_results($wpdb->prepare(
            "SELECT rr.*, u.display_name, u.user_email 
             FROM `{$read_receipts_table}` rr
             LEFT JOIN `{$wpdb->users}` u ON rr.user_id = u.ID
             WHERE rr.message_id = %d
             ORDER BY rr.read_at ASC",
            $message_id
        ));

        $formatted_receipts = array();
        foreach ($receipts as $receipt) {
            $formatted_receipts[] = array(
                'user_id' => (int) $receipt->user_id,
                'user_name' => $receipt->display_name,
                'user_email' => $receipt->user_email,
                'read_at' => $receipt->read_at
            );
        }

        return new WP_REST_Response(array(
            'message_id' => $message_id,
            'read_receipts' => $formatted_receipts,
            'read_count' => count($formatted_receipts)
        ), 200);
    }

    /**
     * Get admin settings
     */
    public function get_admin_settings(WP_REST_Request $request)
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', __('You do not have permission to access settings.', 'wp-live-chat-users'), array('status' => 403));
        }

        return new WP_REST_Response(array(
            'socketUrl' => get_option('wplc_socket_server_url', 'http://localhost:3001'),
            'typingIndicators' => get_option('wplc_enable_typing_indicators', '1') === '1',
            'readReceipts' => get_option('wplc_enable_read_receipts', '1') === '1',
            'presenceStatus' => get_option('wplc_enable_presence_status', '1') === '1',
            'apiKey' => get_option('wplc_api_key', ''),
            'apiEnabled' => get_option('wplc_api_enabled', false),
            'apiUser' => get_option('wplc_api_user_id', '1')
        ), 200);
    }

    /**
     * Save admin settings
     */
    public function save_admin_settings(WP_REST_Request $request)
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', __('You do not have permission to save settings.', 'wp-live-chat-users'), array('status' => 403));
        }

        $data = $request->get_json_params();

        update_option('wplc_socket_server_url', sanitize_url($data['socketUrl']));
        update_option('wplc_enable_typing_indicators', $data['typingIndicators'] ? '1' : '0');
        update_option('wplc_enable_read_receipts', $data['readReceipts'] ? '1' : '0');
        update_option('wplc_enable_presence_status', $data['presenceStatus'] ? '1' : '0');
        update_option('wplc_api_enabled', $data['apiEnabled']);
        update_option('wplc_api_user_id', absint($data['apiUser']));

        if (!empty($data['apiKey'])) {
            update_option('wplc_api_key', sanitize_text_field($data['apiKey']));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Settings saved successfully.', 'wp-live-chat-users')
        ), 200);
    }

    /**
     * Generate new API key
     */
    public function generate_api_key(WP_REST_Request $request)
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', __('You do not have permission to generate API keys.', 'wp-live-chat-users'), array('status' => 403));
        }

        $api_key = 'wplc_api_key_' . wp_generate_password(40, false, false);
        update_option('wplc_api_key', $api_key);

        return new WP_REST_Response(array(
            'apiKey' => $api_key
        ), 200);
    }

    /**
     * Get migrations status
     */
    public function get_migrations_status(WP_REST_Request $request)
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', __('You do not have permission to view migrations.', 'wp-live-chat-users'), array('status' => 403));
        }

        global $wpdb;
        $tables = array(
            'wp_wplc_message_threads' => 'create_message_threads_table',
            'wp_wplc_messages' => 'create_messages_table',
            'wp_wplc_message_attachments' => 'create_attachments_table',
            'wp_wplc_message_read_receipts' => 'create_read_receipts_table',
            'wp_wplc_message_participants' => 'create_message_participants_table'
        );

        $migrations = array();
        foreach ($tables as $table => $name) {
            $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table)) === $table;
            $migrations[] = array(
                'plugin' => 'WP Live Chat Core',
                'name' => $name,
                'status' => $table_exists ? 'completed' : 'pending'
            );
        }

        return new WP_REST_Response(array(
            'migrations' => $migrations
        ), 200);
    }

    /**
     * Run migrations
     */
    public function run_migrations(WP_REST_Request $request)
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', __('You do not have permission to run migrations.', 'wp-live-chat-users'), array('status' => 403));
        }

        // Trigger migrations by running activation

        WPLCDatabaseManager::instance()->run_migrations();

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Migrations completed successfully.', 'wp-live-chat-users')
        ), 200);
    }

    /**
     * Rollback migrations
     */
    public function rollback_migrations(WP_REST_Request $request)
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', __('You do not have permission to rollback migrations.', 'wp-live-chat-users'), array('status' => 403));
        }

        // Trigger rollback
        WPLCDatabaseManager::instance()->rollback_migrations();
        do_action('wplc_rollback_migrations');

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Migrations rolled back successfully.', 'wp-live-chat-users')
        ), 200);
    }
}
