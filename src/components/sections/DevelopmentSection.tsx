import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CodeBlock } from '../CodeBlock';
import { Database, Terminal, GitBranch, TestTube } from 'lucide-react';

export function DevelopmentSection() {
  const schemaCode = `wp_chatpulse_message_threads    - Chat thread storage
wp_chatpulse_messages           - Individual messages  
wp_chatpulse_thread_participants - Thread membership (future)
wp_chatpulse_message_reactions  - Message reactions (future)`;

  const cliCommands = `# Run migrations
wp chatpulse migrate:run

# Rollback migrations  
wp chatpulse migrate:rollback

# Check migration status
wp chatpulse migrate:status

# Generate API key
wp chatpulse api:generate-key

# Test API connection
wp chatpulse api:test`;

  const devWorkflow = `# Start WordPress development
cd wp-plugin/
bun run dev

# Start Socket.IO server development  
cd socket-server/
bun run dev

# Watch for changes and auto-reload
# Frontend: Vite HMR enabled
# Backend: Nodemon for server restart`;

  const testingCode = `# Run PHP tests
composer test

# Run JavaScript tests
npm test

# Run E2E tests
npm run test:e2e

# Code coverage
npm run test:coverage`;

  const contributingSteps = `1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature  
3. Make your changes
4. Run tests: npm test
5. Commit changes: git commit -m 'Add amazing feature'
6. Push to branch: git push origin feature/amazing-feature
7. Open a Pull Request`;

  const codingStandards = `# PHP - WordPress Coding Standards
composer run phpcs

# JavaScript/TypeScript - ESLint + Prettier  
npm run lint
npm run format

# CSS - Tailwind CSS utility classes
npm run lint:css

# Commits - Conventional Commits
git commit -m "feat: add new chat feature"
git commit -m "fix: resolve message ordering issue"  
git commit -m "docs: update API documentation"`;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">🔧 Development</h2>
        <p className="text-lg text-muted-foreground">
          Everything you need to know for contributing to and extending Chatpulse.
        </p>
      </div>

      {/* Database Schema */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Database Schema
        </h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>
              The plugin creates these database tables for chat functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="sql" title="Database Tables">
              {schemaCode}
            </CodeBlock>
            <div className="mt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4>Core Tables</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>message_threads</strong> - Chat conversations</li>
                    <li>• <strong>messages</strong> - Individual chat messages</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4>Future Extensions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>thread_participants</strong> - Group chat members</li>
                    <li>• <strong>message_reactions</strong> - Emoji reactions</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CLI Commands */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2">
          <Terminal className="h-6 w-6" />
          CLI Commands
        </h2>
        
        <Card>
          <CardHeader>
            <CardTitle>WP-CLI Integration</CardTitle>
            <CardDescription>
              Manage the plugin via WordPress command line interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="bash" title="Available Commands">
              {cliCommands}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Development Workflow */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2">
          <GitBranch className="h-6 w-6" />
          Development Workflow
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Local Development</CardTitle>
              <CardDescription>
                Start development servers with hot reload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="bash">
                {devWorkflow}
              </CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contributing Steps</CardTitle>
              <CardDescription>
                Follow these steps to contribute to the project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="text">
                {contributingSteps}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testing */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2">
          <TestTube className="h-6 w-6" />
          Testing
        </h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Suites</CardTitle>
            <CardDescription>
              Run comprehensive tests for all components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="bash" title="Testing Commands">
              {testingCode}
            </CodeBlock>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4>Unit Tests</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PHP functions</li>
                  <li>• React components</li>
                  <li>• TypeScript utilities</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4>Integration Tests</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• API endpoints</li>
                  <li>• Database operations</li>
                  <li>• Socket.IO events</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4>E2E Tests</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• User workflows</li>
                  <li>• Real-time messaging</li>
                  <li>• Cross-browser testing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coding Standards */}
      <div className="space-y-4">
        <h2>Coding Standards</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Code Quality</CardTitle>
            <CardDescription>
              Maintain consistent code style across the project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="bash" title="Code Quality Tools">
              {codingStandards}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Development Tips */}
      <div className="space-y-4">
        <h2>Development Tips</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Frontend Development</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4>Hot Module Replacement</h4>
                <p className="text-sm text-muted-foreground">
                  Vite provides instant feedback during development with HMR enabled for React components.
                </p>
              </div>
              <div>
                <h4>TypeScript Support</h4>
                <p className="text-sm text-muted-foreground">
                  Full type safety with TypeScript strict mode enabled and proper type definitions.
                </p>
              </div>
              <div>
                <h4>Component Testing</h4>
                <p className="text-sm text-muted-foreground">
                  Use React Testing Library for component testing with proper mocking of Socket.IO.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backend Development</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4>WordPress Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Follow WordPress coding standards and use proper hooks and filters for extensibility.
                </p>
              </div>
              <div>
                <h4>Database Migrations</h4>
                <p className="text-sm text-muted-foreground">
                  Use version-controlled migrations for database schema changes with proper rollback support.
                </p>
              </div>
              <div>
                <h4>API Security</h4>
                <p className="text-sm text-muted-foreground">
                  Implement proper authentication, rate limiting, and input validation for all endpoints.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Architecture Decisions */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3>🏗️ Architecture Decisions</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4>Technology Choices</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>React:</strong> Component-based UI with TypeScript</li>
              <li>• <strong>Socket.IO:</strong> Reliable WebSocket with fallbacks</li>
              <li>• <strong>Tailwind:</strong> Utility-first CSS for consistency</li>
              <li>• <strong>Vite:</strong> Fast build tool with HMR</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4>Design Patterns</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Repository Pattern:</strong> Data access abstraction</li>
              <li>• <strong>Event-Driven:</strong> Decoupled component communication</li>
              <li>• <strong>Hook System:</strong> WordPress-style extensibility</li>
              <li>• <strong>Optimistic UI:</strong> Instant user feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}