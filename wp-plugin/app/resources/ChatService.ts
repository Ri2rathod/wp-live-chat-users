// ChatService.ts - WebSocket and REST API integration service
import { io, Socket } from 'socket.io-client';
import { presenceService } from './PresenceService';
import type { UserPresence } from './PresenceService';

// Type definitions for the chat service
export interface ChatParticipant {
  id: number;
  user_id: number;
  display_name?: string;
  name?: string;
  avatar_url?: string;
}

export interface ChatThread {
  id: number;
  type: 'private' | 'group';
  title: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  participants?: ChatParticipant[];
  last_message: {
    content: string;
    created_at: string;
    sender_id: number;
    sender_name: string;
  };
  unread_count: number;
}

export interface ChatMessage {
  id: number | string; // Can be temp ID
  thread_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  content_type: 'text/plain' | 'text/markdown' | 'reaction' | 'system';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  created_at: string;
  updated_at: string;
  attachments?: any[];
  isOptimistic?: boolean;
  tempId?: string;
}

export interface TypingStatus {
  thread_id: number;
  user_id: number;
  is_typing: boolean;
}

export interface PresenceStatus {
  thread_id: number;
  user_id: number;
  status: 'online' | 'offline';
}

export interface ReadReceipt {
  message_id: number;
  user_id: number;
  read_at: string;
}

// Event handlers interface
export interface ChatServiceEvents {
  onThreadsLoaded: (threads: ChatThread[]) => void;
  onMessagesLoaded: (threadId: number, messages: ChatMessage[]) => void;
  onMessageReceived: (message: ChatMessage) => void;
  onMessageUpdated: (message: ChatMessage) => void;
  onMessageConfirmed: (tempId: string, realId: number) => void;
  onTypingStatusChanged: (typing: TypingStatus) => void;
  onPresenceChanged: (presence: PresenceStatus) => void;
  onReadReceiptReceived: (receipt: ReadReceipt) => void;
  onUserPresenceChanged: (presence: UserPresence) => void;
  onBulkPresenceUpdate: (presences: Map<number, UserPresence>) => void;
  onError: (error: any) => void;
  onConnectionStatusChanged: (connected: boolean) => void;
}

class ChatService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;
  private apiBaseUrl: string;
  private socketUrl: string;
  private tempIdCounter = 0;
  private pendingMessages = new Map<string, ChatMessage>();
  private events: Partial<ChatServiceEvents> = {};

  constructor() {
    // Get WordPress API settings
    this.apiBaseUrl = this.getWpApiUrl();
    this.socketUrl = this.getSocketUrl();
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  /**
   * Initialize the chat service
   */
  public async initialize(userId: number, events: Partial<ChatServiceEvents> = {}) {
    this.currentUserId = userId;
    this.events = events;
    
    try {
      await this.connectSocket();
      
      // Initialize presence service
      if (this.socket) {
        presenceService.initialize(this.socket, userId, {
          onPresenceChanged: (presence) => {
            this.events.onUserPresenceChanged?.(presence);
          },
          onBulkPresenceUpdate: (presences) => {
            this.events.onBulkPresenceUpdate?.(presences);
          }
        });
      }
      
      // Load initial threads
      await this.loadThreads();
    } catch (error) {
      console.error('Failed to initialize chat service:', error);
      this.events.onError?.(error);
    }
  }

  /**
   * Cleanup and disconnect
   */
  public disconnect() {
    // Disconnect presence service
    presenceService.disconnect();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
    this.events = {};
    this.pendingMessages.clear();
  }

  // ==========================================
  // WEBSOCKET CONNECTION
  // ==========================================

  private async connectSocket() {
    if (!this.currentUserId) {
      throw new Error('User ID is required');
    }

    this.socket = io(this.socketUrl, {
      auth: {
        userId: this.currentUserId
      },
      autoConnect: true
    });

    this.setupSocketEvents();
    
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Connected to chat server');
        this.events.onConnectionStatusChanged?.(true);
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Socket connection error:', error);
        this.events.onConnectionStatusChanged?.(false);
        reject(error);
      });
    });
  }

  private setupSocketEvents() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason);
      this.events.onConnectionStatusChanged?.(false);
    });

    this.socket.on('error', (error) => {
      console.error('🔥 Socket error:', error);
      this.events.onError?.(error);
    });

    // Message events
    this.socket.on('message', (data: any) => {
      console.log('📨 New message:', data);
      
      // Skip messages sent by current user (they have optimistic updates)
      if (data.senderId === this.currentUserId) {
        console.log('⏭️ Skipping own message from socket broadcast');
        return;
      }
      
      // Convert socket data to ChatMessage format
      const message: ChatMessage = {
        id: data.id,
        thread_id: data.threadId,
        sender_id: data.senderId,
        sender_name: data.senderName,
        content: data.content,
        content_type: data.contentType || 'text/plain',
        status: data.status || 'sent',
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        attachments: data.attachments || []
      };
      this.events.onMessageReceived?.(message);
    });

    // Handle webhook-based messages
    this.socket.on('message:received', (data: any) => {
      console.log('📨 Message received (webhook):', data);
      
      // Skip messages sent by current user (they have optimistic updates)
      if (data.message.sender_id === this.currentUserId) {
        console.log('⏭️ Skipping own message from webhook');
        return;
      }
      
      // Convert socket data to ChatMessage format
      const message: ChatMessage = {
        id: data.message.id,
        thread_id: data.threadId,
        sender_id: data.message.sender_id,
        sender_name: data.message.sender_name,
        content: data.message.content,
        content_type: data.message.content_type || 'text/plain',
        status: data.message.status || 'sent',
        created_at: data.message.created_at,
        updated_at: data.message.updated_at,
        attachments: data.message.attachments || []
      };
      this.events.onMessageReceived?.(message);
    });

    this.socket.on('message_update', (message: ChatMessage) => {
      console.log('📝 Message updated:', message);
      this.events.onMessageUpdated?.(message);
    });

    this.socket.on('message_id_mapping', ({ tempId, realId }) => {
      console.log(`🔄 Message ID mapping: ${tempId} -> ${realId}`);
      
      if (this.pendingMessages.has(tempId)) {
        const message = this.pendingMessages.get(tempId)!;
        message.id = realId;
        message.isOptimistic = false;
        message.status = 'sent';
        this.pendingMessages.delete(tempId);
        
        this.events.onMessageConfirmed?.(tempId, realId);
      }
    });

    // Typing events
    this.socket.on('typing', (data: any) => {
      console.log(`⌨️ Typing status:`, data);
      // Convert camelCase to snake_case for consistency
      const typingStatus: TypingStatus = {
        thread_id: data.threadId || data.thread_id,
        user_id: data.userId || data.user_id,
        is_typing: data.isTyping !== undefined ? data.isTyping : data.is_typing
      };
      this.events.onTypingStatusChanged?.(typingStatus);
    });

    // Presence events
    this.socket.on('presence', (data: PresenceStatus) => {
      console.log(`👤 Presence update:`, data);
      this.events.onPresenceChanged?.(data);
    });

    // Read receipts
    this.socket.on('read_receipt', (data: ReadReceipt) => {
      console.log(`👁️ Read receipt:`, data);
      this.events.onReadReceiptReceived?.(data);
    });

    // Read receipts from webhook
    this.socket.on('message:read', (data: any) => {
      console.log(`👁️ Messages read (webhook):`, data);
      // Could handle multiple message IDs
      if (data.messageIds && data.messageIds.length > 0) {
        data.messageIds.forEach((messageId: number) => {
          this.events.onReadReceiptReceived?.({
            message_id: messageId,
            user_id: data.userId,
            read_at: data.readAt
          });
        });
      }
    });

    // Thread events
    this.socket.on('thread_joined', ({ threadId }) => {
      console.log(`✅ Joined thread ${threadId}`);
    });

    this.socket.on('thread_left', ({ threadId }) => {
      console.log(`👋 Left thread ${threadId}`);
    });

    // Thread update events (from webhooks)
    this.socket.on('thread:updated', (data: any) => {
      console.log(`🔄 Thread updated:`, data);
      // Could trigger a thread list refresh here
      // this.loadThreads();
    });

    // New thread created event
    this.socket.on('thread:created', (data: any) => {
      console.log(`🆕 New thread created:`, data);
      if (data.thread) {
        // Reload threads to show the new one in the list
        this.loadThreads();
      }
    });
  }

  // ==========================================
  // REST API METHODS
  // ==========================================

  /**
   * Load threads from REST API
   */
  public async loadThreads(page = 1, perPage = 20, search = ''): Promise<ChatThread[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        search
      });

      const response = await this.makeApiRequest(`/threads?${params}`);
      const threads = response.threads || [];
      
      this.events.onThreadsLoaded?.(threads);
      return threads;
    } catch (error) {
      console.error('Failed to load threads:', error);
      this.events.onError?.(error);
      return [];
    }
  }

  /**
   * Load messages for a thread
   */
  public async loadMessages(threadId: number, before?: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      if (before) {
        params.append('before', before);
      }

      const response = await this.makeApiRequest(`/threads/${threadId}/messages?${params}`);
      const messages = response.messages || [];
      
      this.events.onMessagesLoaded?.(threadId, messages);
      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.events.onError?.(error);
      return [];
    }
  }

  /**
   * Create a new thread
   */
  public async createThread(type: 'private' | 'group', participants: number[], title?: string): Promise<ChatThread | null> {
    try {
      const response = await this.makeApiRequest('/threads', {
        method: 'POST',
        body: JSON.stringify({
          type,
          participants,
          title
        })
      });

      return response.thread || null;
    } catch (error) {
      console.error('Failed to create thread:', error);
      this.events.onError?.(error);
      return null;
    }
  }

  // ==========================================
  // WEBSOCKET ACTIONS
  // ==========================================

  /**
   * Join a thread room
   */
  public joinThread(threadId: number) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    console.log(`👥 Joining thread ${threadId}`);
    this.socket.emit('join_thread', { threadId });
  }

  /**
   * Leave a thread room
   */
  public leaveThread(threadId: number) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    console.log(`👋 Leaving thread ${threadId}`);
    this.socket.emit('leave_thread', { threadId });
  }

  /**
   * Send a message with optimistic updates
   */
  public sendMessage(
    threadId: number, 
    content: string, 
    contentType: 'text/plain' | 'text/markdown' | 'reaction' = 'text/plain',
    attachments: number[] = []
  ): string {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    // Generate temporary ID
    const tempId = `temp_${this.currentUserId}_${++this.tempIdCounter}_${Date.now()}`;

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: tempId,
      thread_id: threadId,
      sender_id: this.currentUserId,
      sender_name: 'You', // Will be updated with real name
      content,
      content_type: contentType,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments,
      isOptimistic: true,
      tempId
    };

    // Store for tracking
    this.pendingMessages.set(tempId, optimisticMessage);

    // Emit optimistic message for immediate UI update
    this.events.onMessageReceived?.(optimisticMessage);

    // Send to server
    console.log(`💬 Sending message to thread ${threadId}:`, content);
    this.socket.emit('message_send', {
      threadId,
      tempId,
      content,
      contentType,
      attachments
    });

    return tempId;
  }

  /**
   * Send typing indicator
   */
  public setTyping(threadId: number, isTyping: boolean) {
    if (!this.socket?.connected) {
      return;
    }

    console.log(`⌨️ Setting typing status for thread ${threadId}: ${isTyping}`);
    this.socket.emit('typing', { threadId, isTyping });
  }

  /**
   * Mark messages as read
   */
  public markMessagesRead(threadId: number, messageIds: number[]) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    console.log(`👁️ Marking messages as read in thread ${threadId}:`, messageIds);
    this.socket.emit('message_read', { threadId, messageIds });
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private async makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': this.getWpNonce()
      },
      credentials: 'include'
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      // Check if it's an authentication error
      if (response.status === 403) {
        console.warn('WordPress authentication failed. User may not be logged in.');
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private getWpApiUrl(): string {
    // Get from WordPress localized script or fallback
    if (typeof window !== 'undefined' && (window as any).wpApiSettings) {
      return (window as any).wpApiSettings.root + 'wplc-chat/v1';
    }
    return '/wp-json/wplc-chat/v1';
  }

  private getSocketUrl(): string {
    // Get from WordPress localized script or fallback
    if (typeof window !== 'undefined' && (window as any).wplcChatSettings) {
      return (window as any).wplcChatSettings.socketUrl;
    }
    return 'http://localhost:3001';
  }

  private getWpNonce(): string {
    // Get from WordPress localized script
    if (typeof window !== 'undefined' && (window as any).wpApiSettings) {
      return (window as any).wpApiSettings.nonce;
    }
    return '';
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get pending messages for a thread
   */
  public getPendingMessages(threadId: number): ChatMessage[] {
    return Array.from(this.pendingMessages.values())
      .filter(msg => msg.thread_id === threadId);
  }

  /**
   * Clear failed message
   */
  public clearPendingMessage(tempId: string) {
    this.pendingMessages.delete(tempId);
  }

  // ==========================================
  // PRESENCE METHODS
  // ==========================================

  /**
   * Get user presence status
   */
  public getUserPresence(userId: number): UserPresence | null {
    return presenceService.getUserPresence(userId);
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: number): boolean {
    return presenceService.isUserOnline(userId);
  }

  /**
   * Get formatted last seen text
   */
  public getLastSeen(userId: number): string {
    return presenceService.getLastSeenFormatted(userId);
  }

  /**
   * Request presence for specific users
   */
  public requestPresence(userIds: number[]): void {
    presenceService.requestPresence(userIds);
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default ChatService;
