import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CodeBlock } from '../CodeBlock';

export function ArchitectureSection() {
  const architectureCode = `┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Socket.IO Server│    │ WordPress Plugin│
│                 │◄──►│                  │◄──►│                 │
│  - TypeScript   │    │  - Node.js       │    │  - PHP Classes  │
│  - Tailwind CSS │    │  - Express       │    │  - REST API     │
│  - Real-time UI │    │  - WebSocket     │    │  - Database     │
└─────────────────┘    └──────────────────┘    └─────────────────┘`;

  const components = [
    {
      title: "WordPress Plugin",
      path: "/wp-plugin/",
      description: "The core WordPress integration handling authentication, data persistence, and admin functionality.",
      technologies: ["PHP", "WordPress API", "MySQL"],
      features: [
        "REST API endpoints for chat operations",
        "Database management and migrations",
        "User authentication and permissions",
        "Admin interface for configuration"
      ]
    },
    {
      title: "Socket.IO Server",
      path: "/socket-server/",
      description: "Real-time WebSocket server handling live communication between users.",
      technologies: ["Node.js", "Socket.IO", "Express"],
      features: [
        "Real-time WebSocket communication",
        "Event handling for messages, typing, presence",
        "WordPress API integration",
        "Connection management"
      ]
    },
    {
      title: "React Frontend",
      path: "/wp-plugin/app/resources/",
      description: "Modern chat interface providing an intuitive user experience.",
      technologies: ["React", "TypeScript", "Tailwind CSS"],
      features: [
        "Modern chat interface",
        "Real-time message handling",
        "Optimistic UI updates",
        "Connection status management"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">🏗️ Architecture</h2>
        <p className="text-lg text-muted-foreground">
          WP Live Chat Users follows a modern three-tier architecture designed for scalability, maintainability, and performance.
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="space-y-4">
        <h2>System Overview</h2>
        <CodeBlock language="text" title="Architecture Diagram">
          {architectureCode}
        </CodeBlock>
      </div>

      {/* Component Details */}
      <div className="space-y-6">
        <h2>Components</h2>
        <div className="grid gap-6">
          {components.map((component, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{index + 1}.</span>
                      {component.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded mr-2">
                        {component.path}
                      </code>
                      {component.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {component.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {component.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="space-y-4">
        <h2>Technology Stack</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frontend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge>React 18</Badge>
                <Badge>TypeScript</Badge>
                <Badge>Tailwind CSS</Badge>
                <Badge>Vite</Badge>
                <Badge>Socket.IO Client</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Backend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge>Node.js</Badge>
                <Badge>Socket.IO</Badge>
                <Badge>Express</Badge>
                <Badge>WordPress REST API</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">WordPress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge>PHP 7.4+</Badge>
                <Badge>WordPress 5.6+</Badge>
                <Badge>MySQL/MariaDB</Badge>
                <Badge>Composer</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Flow */}
      <div className="space-y-4">
        <h2>Data Flow</h2>
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h3>Message Sending Flow</h3>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
              <span>User types message in React frontend</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
              <span>Frontend emits Socket.IO event to server</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
              <span>Socket.IO server validates and saves message via WordPress REST API</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
              <span>Server broadcasts message to relevant connected users</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">5</span>
              <span>Frontend receives and displays message in real-time</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}