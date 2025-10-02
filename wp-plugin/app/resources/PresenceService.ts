// PresenceService.ts - User presence tracking module
import { Socket } from 'socket.io-client';

export interface UserPresence {
  user_id: number;
  status: 'online' | 'offline' | 'away';
  last_seen?: string;
}

export interface PresenceEvents {
  onPresenceChanged: (presence: UserPresence) => void;
  onBulkPresenceUpdate: (presences: Map<number, UserPresence>) => void;
}

class PresenceService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;
  private presenceMap: Map<number, UserPresence> = new Map();
  private events: Partial<PresenceEvents> = {};
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private awayTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize the presence service
   */
  initialize(socket: Socket, userId: number, events: Partial<PresenceEvents>): void {
    if (this.isInitialized) {
      console.warn('PresenceService already initialized');
      return;
    }

    this.socket = socket;
    this.currentUserId = userId;
    this.events = events;
    this.isInitialized = true;

    this.setupSocketListeners();
    this.startHeartbeat();
    this.setupActivityTracking();

    console.log('PresenceService initialized for user:', userId);
  }

  /**
   * Setup socket event listeners for presence
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Listen for individual presence updates
    this.socket.on('presence:status', (data: UserPresence) => {
      console.log('Presence update received:', data);
      this.updatePresence(data.user_id, data);
    });

    // Listen for bulk presence updates (when joining or initial load)
    this.socket.on('presence:bulk', (presences: UserPresence[]) => {
      console.log('Bulk presence update received:', presences.length);
      presences.forEach(presence => {
        this.updatePresence(presence.user_id, presence);
      });
      
      if (this.events.onBulkPresenceUpdate) {
        this.events.onBulkPresenceUpdate(this.presenceMap);
      }
    });

    // Listen for user disconnections
    this.socket.on('user:disconnect', (data: { user_id: number }) => {
      console.log('User disconnected:', data.user_id);
      this.updatePresence(data.user_id, {
        user_id: data.user_id,
        status: 'offline',
        last_seen: new Date().toISOString()
      });
    });
  }

  /**
   * Update presence status for a user
   */
  private updatePresence(userId: number, presence: UserPresence): void {
    this.presenceMap.set(userId, presence);
    
    if (this.events.onPresenceChanged) {
      this.events.onPresenceChanged(presence);
    }
  }

  /**
   * Start heartbeat to maintain online status
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendPresenceUpdate('online');
    }, 30000);

    // Send initial presence
    this.sendPresenceUpdate('online');
  }

  /**
   * Setup activity tracking to detect away status
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const resetAwayTimer = () => {
      // Clear existing timeout
      if (this.awayTimeout) {
        clearTimeout(this.awayTimeout);
      }

      // Set status to online if it was away
      const currentPresence = this.presenceMap.get(this.currentUserId!);
      if (currentPresence?.status === 'away') {
        this.sendPresenceUpdate('online');
      }

      // Set away after 5 minutes of inactivity
      this.awayTimeout = setTimeout(() => {
        this.sendPresenceUpdate('away');
      }, 5 * 60 * 1000);
    };

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetAwayTimer, { passive: true });
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendPresenceUpdate('away');
      } else {
        this.sendPresenceUpdate('online');
        resetAwayTimer();
      }
    });

    // Initialize the away timer
    resetAwayTimer();
  }

  /**
   * Send presence update to server
   */
  private sendPresenceUpdate(status: 'online' | 'offline' | 'away'): void {
    if (!this.socket || !this.currentUserId || !this.socket.connected) {
      return;
    }

    const presence: UserPresence = {
      user_id: this.currentUserId,
      status,
      last_seen: new Date().toISOString()
    };

    this.socket.emit('presence:update', presence);
    this.updatePresence(this.currentUserId, presence);
  }

  /**
   * Request presence for specific users
   */
  requestPresence(userIds: number[]): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Cannot request presence: socket not connected');
      return;
    }

    console.log('📋 Requesting presence for users:', userIds);
    this.socket.emit('presence:request', { user_ids: userIds });
  }

  /**
   * Get presence status for a specific user
   */
  getUserPresence(userId: number): UserPresence | null {
    return this.presenceMap.get(userId) || null;
  }

  /**
   * Get presence status for multiple users
   */
  getBulkPresence(userIds: number[]): Map<number, UserPresence> {
    const result = new Map<number, UserPresence>();
    userIds.forEach(userId => {
      const presence = this.presenceMap.get(userId);
      if (presence) {
        result.set(userId, presence);
      }
    });
    return result;
  }

  /**
   * Get all tracked presences
   */
  getAllPresences(): Map<number, UserPresence> {
    return new Map(this.presenceMap);
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: number): boolean {
    const presence = this.presenceMap.get(userId);
    return presence?.status === 'online';
  }

  /**
   * Get formatted last seen time
   */
  getLastSeenFormatted(userId: number): string {
    const presence = this.presenceMap.get(userId);
    
    if (!presence) {
      return 'Unknown';
    }

    if (presence.status === 'online') {
      return 'Online';
    }

    if (presence.status === 'away') {
      return 'Away';
    }

    if (!presence.last_seen) {
      return 'Offline';
    }

    // Calculate time difference
    const lastSeen = new Date(presence.last_seen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return 'Long time ago';
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.awayTimeout) {
      clearTimeout(this.awayTimeout);
      this.awayTimeout = null;
    }

    // Send offline status before disconnecting
    if (this.socket && this.socket.connected) {
      this.sendPresenceUpdate('offline');
    }

    this.presenceMap.clear();
    this.isInitialized = false;

    console.log('PresenceService disconnected');
  }
}

// Export singleton instance
export const presenceService = new PresenceService();
