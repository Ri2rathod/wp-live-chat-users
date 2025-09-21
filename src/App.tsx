import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { OverviewSection } from './components/sections/OverviewSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { ArchitectureSection } from './components/sections/ArchitectureSection';
import { InstallationSection } from './components/sections/InstallationSection';
import { UsageSection } from './components/sections/UsageSection';
import { DevelopmentSection } from './components/sections/DevelopmentSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { CodeBlock } from './components/CodeBlock';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { 
  Shield, 
  Server, 
  Users, 
  ExternalLink, 
  Heart,
  Github,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

function ApiSection() {
  const restApiExample = `// Initialize chat service
const chatService = new WPLCChatService({
  baseUrl: 'https://yoursite.com',
  apiKey: 'your-api-key'
});

// Get threads
const threads = await chatService.getThreads();

// Send message
const message = await chatService.sendMessage(threadId, {
  content: 'Hello there!',
  type: 'text'
});

// Listen for real-time events
chatService.on('message_received', (message) => {
  console.log('New message:', message);
});`;

  const webhookExample = `// Set up webhook endpoint
add_action('rest_api_init', function() {
  register_rest_route('wplc-chat/v1', '/webhook', [
    'methods' => 'POST',
    'callback' => 'handle_chat_webhook',
    'permission_callback' => 'verify_webhook_signature'
  ]);
});

function handle_chat_webhook($request) {
  $event = $request->get_param('event');
  $data = $request->get_param('data');
  
  switch($event) {
    case 'message_sent':
      // Handle message sent event
      break;
    case 'user_joined':
      // Handle user joined event  
      break;
  }
  
  return new WP_REST_Response(['status' => 'success'], 200);
}`;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1>📚 API Reference</h1>
        <p className="text-lg text-muted-foreground">
          Complete API documentation for integrating with WP Live Chat Users.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>REST API Integration</CardTitle>
            <CardDescription>
              Use the REST API for custom integrations and third-party apps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="javascript" title="JavaScript SDK">
              {restApiExample}
            </CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Integration</CardTitle>
            <CardDescription>
              Set up webhooks to receive real-time notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="php" title="Webhook Handler">
              {webhookExample}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SecuritySection() {
  const securityHeaders = `# Apache .htaccess
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY  
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"`;

  const rateLimitingExample = `// Implement rate limiting
add_filter('wplc_message_rate_limit', function($limit, $user_id) {
  // Allow 60 messages per minute for regular users
  if (user_can($user_id, 'moderate_comments')) {
    return 120; // Higher limit for moderators
  }
  return 60;
}, 10, 2);`;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="flex items-center gap-2">
          <Shield className="h-8 w-8" />
          🔒 Security
        </h1>
        <p className="text-lg text-muted-foreground">
          Security best practices and configuration for WP Live Chat Users.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Headers</CardTitle>
            <CardDescription>
              Recommended security headers for production deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="apache" title="Apache Configuration">
              {securityHeaders}
            </CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
            <CardDescription>
              Implement custom rate limiting for chat messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="php" title="Custom Rate Limits">
              {rateLimitingExample}
            </CodeBlock>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">API Keys</p>
                  <p className="text-sm text-muted-foreground">Rotate regularly and store securely</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Input Validation</p>
                  <p className="text-sm text-muted-foreground">All messages are sanitized and validated</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Permission Checks</p>
                  <p className="text-sm text-muted-foreground">Thread access validated per request</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Considerations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">CORS Configuration</p>
                  <p className="text-sm text-muted-foreground">Restrict origins in production</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">SSL/TLS Required</p>
                  <p className="text-sm text-muted-foreground">WebSocket connections need HTTPS</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Data Privacy</p>
                  <p className="text-sm text-muted-foreground">Follow GDPR and local privacy laws</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DeploymentSection() {
  const productionChecklist = `✓ Set NODE_ENV=production
✓ Configure proper CORS origins
✓ Set up SSL/TLS certificates
✓ Configure reverse proxy for WebSocket
✓ Set up database backups
✓ Configure log rotation
✓ Set up monitoring and alerts
✓ Test failover scenarios`;

  const dockerExample = `# Example Dockerfile for Socket.IO server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]`;

  const nginxConfig = `# Nginx configuration for WebSocket proxy
upstream socketio_backend {
    server 127.0.0.1:3001;
}

server {
    listen 443 ssl;
    server_name chat.yoursite.com;
    
    location /socket.io/ {
        proxy_pass http://socketio_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="flex items-center gap-2">
          <Server className="h-8 w-8" />
          🚀 Deployment
        </h1>
        <p className="text-lg text-muted-foreground">
          Production deployment guide and best practices for WP Live Chat Users.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Production Checklist</CardTitle>
            <CardDescription>
              Essential steps before going live
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="text" title="Pre-deployment Checklist">
              {productionChecklist}
            </CodeBlock>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Docker Deployment</CardTitle>
              <CardDescription>
                Containerized deployment with Docker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="dockerfile" title="Dockerfile">
                {dockerExample}
              </CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nginx Configuration</CardTitle>
              <CardDescription>
                Reverse proxy setup for WebSocket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="nginx" title="nginx.conf">
                {nginxConfig}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContributingSection() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="flex items-center gap-2">
          <Users className="h-8 w-8" />
          🤝 Contributing
        </h1>
        <p className="text-lg text-muted-foreground">
          We welcome contributions! Help make WP Live Chat Users even better.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ways to Contribute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center">
                  <Github className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Code Contributions</p>
                  <p className="text-sm text-muted-foreground">Bug fixes, new features, improvements</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Documentation</p>
                  <p className="text-sm text-muted-foreground">Improve docs, write tutorials</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Community Support</p>
                  <p className="text-sm text-muted-foreground">Help users, answer questions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <a href="https://github.com/Ri2rathod/wp-live-chat-users/issues" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  View Open Issues
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://github.com/Ri2rathod/wp-live-chat-users/discussions" target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Join Discussions
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://github.com/Ri2rathod/wp-live-chat-users/wiki" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Read Contributing Guide
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center py-8">
          <h3 className="mb-4">🙏 Acknowledgments</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div>WordPress community for the robust platform</div>
            <div>Socket.IO team for real-time communication</div>
            <div>React and TypeScript teams for modern frontend tools</div>
            <div>Tailwind CSS for utility-first styling</div>
          </div>
          <div className="mt-8 space-y-2">
            <p className="flex items-center justify-center gap-2">
              Made with <Heart className="h-4 w-4 text-red-500" /> by{' '}
              <a 
                href="https://github.com/Ri2rathod" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Rathod Ritesh
              </a>
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary">GPL-2.0+</Badge>
              <Badge variant="secondary">Open Source</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'features':
        return <FeaturesSection />;
      case 'architecture':
        return <ArchitectureSection />;
      case 'installation':
        return <InstallationSection />;
      case 'usage':
        return <UsageSection />;
      case 'development':
        return <DevelopmentSection />;
      case 'api':
        return <ApiSection />;
      case 'security':
        return <SecuritySection />;
      case 'deployment':
        return <DeploymentSection />;
      case 'contributing':
        return <ContributingSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      
      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl">
          {renderSection()}
          
          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>© 2024 WP Live Chat Users</span>
                <Badge variant="secondary">GPL-2.0+</Badge>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://github.com/Ri2rathod/wp-live-chat-users" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://github.com/Ri2rathod/wp-live-chat-users/issues" target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Support
                  </a>
                </Button>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}