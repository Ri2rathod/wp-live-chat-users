=== WP Live Chat Users ===
Contributors: ri2rathod
Tags: chat, live chat, real-time, websocket, socket.io, messaging, user chat, private message
Requires at least: 5.6
Tested up to: 6.9
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Real-time user-to-user chat plugin for WordPress using a self-hosted WebSocket (Socket.IO) server.

== Description ==

**WP Live Chat Users** is a modern, high-performance real-time chat system for WordPress. It enables seamless user-to-user communication using WebSocket technology, providing a smooth and responsive experience similar to modern messaging apps.

Unlike traditional WordPress chat plugins that rely on frequent AJAX polling (which can strain your server), this plugin uses **Socket.IO** for true real-time bidirectional communication.

=== ✨ Key Features ===

*   **🚀 Real-Time Messaging**: Instant delivery and receipt of messages without page refreshes.
*   **✍️ Typing Indicators**: See when the person you're chatting with is composing a message.
*   **✅ Message Status**: Real-time updates for message status: Sent, Delivered, and Read.
*   **📁 File Attachments**: Share images and documents directly within chat threads.
*   **👥 Private & Group Chats**: Support for one-on-one private messaging and extensible group conversations.
*   **🎨 Modern UI/UX**: A beautiful, responsive interface built with React, Radix UI, and Tailwind CSS.
*   **🔐 Secure**: Integrated with WordPress authentication and uses API keys for server-to-server communication.
*   **🛠️ Developer Friendly**: Includes a robust database migration system and comprehensive WP-CLI commands.

== Installation ==

=== Prerequisites ===
*   **WordPress 5.6+** with PHP 7.4+
*   **Node.js 16+** (to run the companion WebSocket server)
*   **Composer** (for managing PHP dependencies)

=== 1. Plugin Setup ===
1.  Upload the `wp-live-chat-users` folder to your `/wp-content/plugins/` directory.
2.  Navigate to the plugin directory and run `composer install` to install PHP dependencies.
3.  Activate the plugin through the 'Plugins' menu in WordPress.

=== 2. WebSocket Server Setup ===
This plugin requires a companion Node.js server to handle real-time events.
1.  Navigate to the `socket-server` directory.
2.  Run `npm install` (or `bun install`) to install dependencies.
3.  Copy `.env.example` to `.env` and configure your WordPress site URL and API key.
4.  Start the server: `npm start` (or `bun start`).

=== 3. Configuration ===
1.  Go to **Settings > WPLC API** in your WordPress dashboard.
2.  Generate an API key and ensure it matches the one in your `socket-server/.env`.
3.  Run database migrations via **Tools > WPLC Migrations** or via WP-CLI: `wp wplc migrate`.
4.  Add the chat interface to any page using the shortcode: `[wplc-chat]`.

== Frequently Asked Questions ==

= Do I need a separate server for WebSockets? =
You don't necessarily need a *separate* physical server, but you do need the ability to run a Node.js process (the `socket-server`) alongside your WordPress installation. Many VPS providers allow this.

= Is my data secure? =
Yes. All messages are stored in your own WordPress database. The WebSocket server acts as a real-time relay and does not store your message history permanently.

= Can I customize the look and feel? =
The frontend is built with Tailwind CSS, making it highly customizable for developers. We also provide hooks and filters for PHP-side customizations.

== Screenshots ==

1. **Chat Dashboard**: A clean overview of all your active conversations.
2. **Active Conversation**: Real-time messaging interface with typing indicators and read receipts.
3. **Admin Settings**: Easy configuration for API keys and server connection.

== Changelog ==

= 0.1.0 =
*   Initial release.
*   Core WebSocket integration with Socket.IO.
*   React-based modern chat interface.
*   Message status tracking (Sent/Delivered/Read).
*   File attachment support.
*   WP-CLI integration for migrations.

== Upgrade Notice ==

= 0.1.0 =
Initial version release. Enjoy real-time chatting!
