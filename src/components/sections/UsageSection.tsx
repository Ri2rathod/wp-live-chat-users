import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CodeBlock } from '../CodeBlock';
import { Users, Code, Smartphone } from 'lucide-react';

export function UsageSection() {
  const shortcodeExample = `[chatpulse-chat]`;

  const restApiExamples = `// Get user threads
GET /wp-json/chatpulse-chat/v1/threads

// Create new thread
POST /wp-json/chatpulse-chat/v1/threads

// Get thread messages
GET /wp-json/chatpulse-chat/v1/threads/{id}/messages

// Send message
POST /wp-json/chatpulse-chat/v1/threads/{id}/messages

// Update typing status
POST /wp-json/chatpulse-chat/v1/threads/{id}/typing

// Mark messages as read
POST /wp-json/chatpulse-chat/v1/threads/{id}/read`;

  const socketEvents = `// Client to Server
socket.emit('join_thread', { thread_id: 1 });
socket.emit('send_message', { thread_id: 1, content: 'Hello!' });
socket.emit('typing', { thread_id: 1, is_typing: true });

// Server to Client
socket.on('message_received', (message) => { /* handle */ });
socket.on('typing_status', (status) => { /* handle */ });
socket.on('user_joined', (user) => { /* handle */ });`;

  const hooksFilters = `// Customize user chat permissions
add_filter('chatpulse_user_can_access_chat', function($can_access, $user, $request) {
    return $user->has_cap('read'); // Customize logic
}, 10, 3);

// Modify thread access
add_filter('chatpulse_user_can_access_thread', function($can_access, $user_id, $thread_id, $thread) {
    return true; // Customize access logic
}, 10, 4);

// Chat message sent hook
add_action('chatpulse_message_sent', function($message, $thread, $user) {
    // Custom logic after message sent
}, 10, 3);`;

  const customizationExample = `// Add custom CSS
add_action('wp_head', function() {
    echo '<style>
        .chatpulse-chat-container {
            --chat-primary-color: #your-color;
            --chat-border-radius: 12px;
        }
    </style>';
});

// Customize user display name
add_filter('chatpulse_user_display_name', function($display_name, $user) {
    return $user->display_name . ' (' . $user->user_login . ')';
}, 10, 2);`;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">🚀 Usage</h2>
        <p className="text-lg text-muted-foreground">
          Learn how to use Chatpulse in your WordPress site, from basic implementation to advanced customization.
        </p>
      </div>

      {/* For Users */}
      <div className="space-y-6">
        <h2 className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          For Users
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Chat to Pages</CardTitle>
              <CardDescription>
                Add the chat interface to any page or post using a simple shortcode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="php" title="WordPress Shortcode">
                {shortcodeExample}
              </CodeBlock>
              <div className="mt-4 space-y-2">
                <h4>Additional Parameters:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><code className="bg-muted px-1 rounded">width</code> - Set chat width (default: 100%)</li>
                  <li><code className="bg-muted px-1 rounded">height</code> - Set chat height (default: 400px)</li>
                  <li><code className="bg-muted px-1 rounded">theme</code> - light or dark theme</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Actions</CardTitle>
              <CardDescription>
                Basic actions users can perform in the chat interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <p className="font-medium">Start Conversations</p>
                    <p className="text-sm text-muted-foreground">Click "New Chat" to start messaging</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <p className="font-medium">Send Messages</p>
                    <p className="text-sm text-muted-foreground">Type and press Enter or click Send</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <p className="font-medium">Manage Conversations</p>
                    <p className="text-sm text-muted-foreground">View all chats in the sidebar</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* For Developers */}
      <div className="space-y-6">
        <h2 className="flex items-center gap-2">
          <Code className="h-6 w-6" />
          For Developers
        </h2>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>REST API Endpoints</CardTitle>
              <CardDescription>
                Available endpoints for chat operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="javascript" title="API Endpoints">
                {restApiExamples}
              </CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WebSocket Events</CardTitle>
              <CardDescription>
                Real-time events for Socket.IO integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="javascript" title="Socket.IO Events">
                {socketEvents}
              </CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WordPress Hooks & Filters</CardTitle>
              <CardDescription>
                Customize chat behavior with WordPress hooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="php" title="Hooks and Filters">
                {hooksFilters}
              </CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customization Examples</CardTitle>
              <CardDescription>
                Common customization scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="php" title="Custom Styling and Logic">
                {customizationExample}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Usage */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2">
          <Smartphone className="h-6 w-6" />
          Mobile Usage
        </h2>
        
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h3>Mobile Optimization</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4>Touch Gestures</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Swipe to navigate between conversations</li>
                <li>• Long press for message options</li>
                <li>• Pull to refresh conversation list</li>
                <li>• Tap to focus message input</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4>Responsive Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Collapsible sidebar on small screens</li>
                <li>• Optimized keyboard handling</li>
                <li>• Touch-friendly button sizes</li>
                <li>• Auto-scroll to new messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="space-y-4">
        <h2>Integration Examples</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="php">
{`// In your theme's functions.php
function add_chat_to_pages() {
    if (is_user_logged_in()) {
        echo do_shortcode('[chatpulse-chat]');
    }
}
add_action('wp_footer', 'add_chat_to_pages');`}
              </CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Post Type</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="php">
{`// Add chat to custom post type
function add_chat_to_products($content) {
    if (is_singular('product')) {
        $content .= do_shortcode('[chatpulse-chat]');
    }
    return $content;
}
add_filter('the_content', 'add_chat_to_products');`}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}