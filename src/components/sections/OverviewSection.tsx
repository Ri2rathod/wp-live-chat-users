import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ExternalLink, Download, Star } from 'lucide-react';

export function OverviewSection() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">GPL-2.0+</Badge>
          <Badge variant="secondary">WordPress 5.6+</Badge>
          <Badge variant="secondary">PHP 7.4+</Badge>
          <Badge variant="secondary">Node.js 16+</Badge>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Chatpulse - Real-Time WordPress Chat Plugin Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            A modern, real-time chat system for WordPress that enables user-to-user communication with a self-hosted WebSocket server. Built with React, TypeScript, and Socket.IO for optimal performance and user experience. Complete guide for installation, usage, and development of live chat features for your WordPress site.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="#installation">
              <Download className="h-4 w-4 mr-2" />
              Get Started
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://github.com/Ri2rathod/chatpulse" target="_blank" rel="noopener noreferrer">
              <Star className="h-4 w-4 mr-2" />
              Star on GitHub
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="space-y-4">
        <h2>Why Choose Chatpulse?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="text-primary">🚀 Real-Time Performance</h3>
            <p className="text-sm text-muted-foreground">
              WebSocket-powered instant messaging with typing indicators and connection status for the best user experience.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-primary">🔐 WordPress Native</h3>
            <p className="text-sm text-muted-foreground">
              Seamlessly integrates with WordPress users and permissions, maintaining your existing authentication system.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-primary">⚡ Modern Tech Stack</h3>
            <p className="text-sm text-muted-foreground">
              Built with React, TypeScript, and Socket.IO for maintainable, scalable, and performant code.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-primary">🎨 Beautiful UI</h3>
            <p className="text-sm text-muted-foreground">
              Responsive design with Tailwind CSS, dark/light mode support, and mobile-optimized interface.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-primary">🔧 Self-Hosted</h3>
            <p className="text-sm text-muted-foreground">
              Complete control over your data with self-hosted WebSocket server and WordPress integration.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-primary">📚 Well Documented</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive documentation, API reference, and examples for easy setup and customization.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="mb-4">Project Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Open Source</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">5.6+</div>
            <div className="text-sm text-muted-foreground">WordPress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">7.4+</div>
            <div className="text-sm text-muted-foreground">PHP Version</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">16+</div>
            <div className="text-sm text-muted-foreground">Node.js</div>
          </div>
        </div>
      </div>
    </div>
  );
}