import { 
  Zap, 
  MessageSquare, 
  Palette, 
  Shield, 
  BarChart3,
  Smartphone,
  Users,
  Search
} from 'lucide-react';
import { FeatureCard } from '../FeatureCard';

export function FeaturesSection() {
  const features = [
    {
      title: "Real-Time Communication",
      description: "Lightning-fast messaging experience",
      icon: Zap,
      features: [
        "Instant messaging with WebSocket (Socket.IO) technology",
        "Live typing indicators to show when users are composing messages",
        "Connection status indicators for network reliability",
        "Message delivery status (pending, sent, delivered, read)"
      ]
    },
    {
      title: "Chat Management",
      description: "Comprehensive conversation tools",
      icon: MessageSquare,
      features: [
        "Private messaging between users",
        "Group chat support (extensible for future features)",
        "Thread-based conversations with persistent history",
        "Message search and conversation filtering",
        "Unread message counters and notifications"
      ]
    },
    {
      title: "Modern UI/UX",
      description: "Beautiful and accessible interface",
      icon: Palette,
      features: [
        "Responsive design built with Tailwind CSS",
        "React-powered frontend with TypeScript for type safety",
        "Dark/light mode support (customizable)",
        "Accessible interface following WCAG guidelines",
        "Mobile-optimized chat experience"
      ]
    },
    {
      title: "Security & Authentication",
      description: "Enterprise-grade security",
      icon: Shield,
      features: [
        "WordPress user integration with existing authentication",
        "API key authentication for secure server communication",
        "Permission-based access control for chat threads",
        "Data sanitization and validation",
        "Rate limiting and abuse prevention"
      ]
    },
    {
      title: "Performance",
      description: "Optimized for speed and efficiency",
      icon: BarChart3,
      features: [
        "Optimistic UI updates for instant feedback",
        "Efficient database queries with proper indexing",
        "WebSocket fallback to REST API when needed",
        "Message pagination and lazy loading",
        "Minimal resource footprint"
      ]
    },
    {
      title: "Mobile Responsive",
      description: "Perfect on any device",
      icon: Smartphone,
      features: [
        "Touch-optimized interface for mobile devices",
        "Responsive layout that adapts to screen size",
        "Swipe gestures for navigation",
        "Mobile-first design approach"
      ]
    },
    {
      title: "User Management",
      description: "Advanced user features",
      icon: Users,
      features: [
        "User presence indicators",
        "Online/offline status tracking",
        "User profiles and avatars",
        "Block and report functionality"
      ]
    },
    {
      title: "Search & Discovery",
      description: "Find what you're looking for",
      icon: Search,
      features: [
        "Full-text message search",
        "Conversation filtering and sorting",
        "Advanced search filters",
        "Message bookmarking and favorites"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">✨ Features</h2>
        <p className="text-lg text-muted-foreground">
          WP Live Chat Users comes packed with modern features designed to provide the best real-time communication experience for your WordPress site.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            features={feature.features}
          />
        ))}
      </div>
    </div>
  );
}