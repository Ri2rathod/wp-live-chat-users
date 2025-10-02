import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CodeBlock } from '../CodeBlock';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

export function InstallationSection() {
  const prerequisitesCode = `WordPress 5.6+    ✓ with PHP 7.4+
Node.js 16+      ✓ with npm or bun
MySQL/MariaDB    ✓ database
Web server       ✓ (Apache/Nginx) with WebSocket support`;

  const pluginInstallCode = `# Clone the repository
git clone https://github.com/Ri2rathod/wp-live-chat-users.git
cd wp-live-chat-users

# Install plugin in WordPress
cp -r wp-plugin/ /path/to/wordpress/wp-content/plugins/wp-live-chat-users/

# Install PHP dependencies
cd /path/to/wordpress/wp-content/plugins/wp-live-chat-users/
composer install`;

  const frontendBuildCode = `# Navigate to plugin directory
cd wp-plugin/

# Install dependencies
npm install
# or
bun install

# Build for production
npm run build
# or
bun run build

# For development
npm run dev
# or
bun run dev`;

  const socketServerCode = `# Navigate to server directory
cd socket-server/

# Install dependencies
npm install
# or
bun install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start server
npm start
# or
bun start

# For development with auto-reload
npm run dev
# or
bun run dev`;

  const wpCliCode = `# Run database migrations
wp wplc migrate:run --path=/path/to/wordpress

# Configure API settings in WordPress admin:
# Go to Settings > WPLC API
# - Enable API access
# - Generate API key
# - Configure user permissions`;

  const envCode = `# WordPress Integration
WP_BASE_URL=https://yoursite.com
WP_API_NAMESPACE=wplc-chat/v1
WP_API_KEY=your_generated_api_key_here
WP_API_TIMEOUT=10000

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://yoursite.com
CORS_METHODS=GET,POST

# Socket.IO Configuration
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000`;

  const steps = [
    {
      title: "WordPress Plugin Setup",
      description: "Install and configure the WordPress plugin",
      code: pluginInstallCode,
      language: "bash"
    },
    {
      title: "Frontend Build",
      description: "Build the React frontend application",
      code: frontendBuildCode,
      language: "bash"
    },
    {
      title: "Socket.IO Server Setup",
      description: "Configure and start the WebSocket server",
      code: socketServerCode,
      language: "bash"
    },
    {
      title: "WordPress Configuration",
      description: "Set up database and API configuration",
      code: wpCliCode,
      language: "bash"
    },
    {
      title: "Environment Configuration",
      description: "Create and configure the environment file",
      code: envCode,
      language: "env"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">📦 Installation</h2>
        <p className="text-lg text-muted-foreground">
          Follow this step-by-step guide to install and configure WP Live Chat Users on your WordPress site.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="space-y-4">
        <h2>Prerequisites</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                System Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="text" title="Required Software">
                {prerequisitesCode}
              </CodeBlock>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recommended Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Server</Badge>
                <span className="text-sm">VPS or dedicated hosting</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Memory</Badge>
                <span className="text-sm">Minimum 1GB RAM</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">SSL</Badge>
                <span className="text-sm">Required for WebSocket</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Domain</Badge>
                <span className="text-sm">WebSocket subdomain recommended</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="space-y-6">
        <h2>Installation Steps</h2>
        
        {steps.map((step, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                {step.title}
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language={step.language}>
                {step.code}
              </CodeBlock>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notes */}
      <div className="space-y-4">
        <h2>Important Notes</h2>
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>WebSocket Configuration:</strong> Ensure your web server (Apache/Nginx) is configured to proxy WebSocket connections to the Socket.IO server on port 3001.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>SSL Certificate:</strong> WebSocket connections require HTTPS in production. Make sure your SSL certificate covers both your main domain and any subdomains used for the WebSocket server.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Firewall Configuration:</strong> Open port 3001 for the Socket.IO server and ensure your firewall allows WebSocket connections.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3>🚀 Quick Start</h3>
        <p className="text-sm text-muted-foreground">
          For a quick test installation on a local development environment:
        </p>
        <CodeBlock language="bash">
{`# Quick local setup
git clone https://github.com/Ri2rathod/wp-live-chat-users.git
cd wp-live-chat-users

# Install all dependencies
npm run install:all

# Start development servers
npm run dev:all

# Access your WordPress site with chat enabled`}
        </CodeBlock>
      </div>
    </div>
  );
}