// socket-server/wordpress-integration.js
// WordPress REST API integration utilities for Socket.IO server

import fetch from 'node-fetch'; // You may need to install: npm install node-fetch

class WordPressIntegration {
  constructor(config = {}) {
    this.wpBaseUrl = config.wpBaseUrl || 'http://localhost/wp-json';
    this.apiNamespace = config.apiNamespace || 'chatpulse-chat/v1';
    this.apiKey = config.apiKey || null; // For application passwords
    this.timeout = config.timeout || 10000;
    
    this.baseApiUrl = `${this.wpBaseUrl}/${this.apiNamespace}`;
    
    console.log(`🔌 WordPress integration initialized: ${this.baseApiUrl}`);
  }

  // ==========================================
  // AUTHENTICATION HELPERS
  // ==========================================

  /**
   * Get headers for API requests
   */
  getHeaders(userId = null) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'WP-Live-Chat-Socket-Server/1.0'
    };

    // Add API key authentication if available
    if (this.apiKey) {
      headers['X-Chatpulse-API-Key'] = this.apiKey;
    }

    // You could implement per-user JWT tokens here
    if (userId) {
      // headers['X-User-ID'] = userId.toString();
    }

    return headers;
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(endpoint, options = {}) {
    // Handle different base URLs for WordPress core vs custom API
    const baseUrl = options.baseUrl || this.baseApiUrl;
    const url = endpoint.startsWith('/wp/v2/') 
      ? `${this.wpBaseUrl}${endpoint}`
      : `${baseUrl}${endpoint}`;
      
    const defaultOptions = {
      timeout: this.timeout,
      headers: this.getHeaders(options.userId)
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Response: ${url} - Success`);
      return data;

    } catch (error) {
      console.error(`❌ API Error: ${url} -`, error.message);
      throw error;
    }
  }

  // ==========================================
  // THREAD OPERATIONS
  // ==========================================

  /**
   * Get all threads for user
   */
  async getThreads(userId, options = {}) {
    const params = new URLSearchParams({
      page: options.page || 1,
      per_page: options.per_page || 20,
      search: options.search || ''
    });

    try {
      const response = await this.makeRequest(`/threads?${params}`, {
        method: 'GET',
        userId
      });
      
      return response.threads || [];
      
    } catch (error) {
      console.error(`Failed to get threads for user ${userId}:`, error.message);
      return [];
    }
  }

  /**
   * Create a new thread
   */
  async createThread(userId, threadData) {
    const { type, title, participants } = threadData;
    
    try {
      const response = await this.makeRequest('/threads', {
        method: 'POST',
        userId,
        body: JSON.stringify({
          type,
          title,
          participants
        })
      });

      return response.thread;

    } catch (error) {
      console.error('Failed to create thread:', error.message);
      throw error;
    }
  }

  /**
   * Get thread messages
   */
  async getThreadMessages(threadId, options = {}) {
    const params = new URLSearchParams({
      before: options.before || '',
      limit: options.limit || 50
    });

    try {
      const response = await this.makeRequest(`/threads/${threadId}/messages?${params}`, {
        method: 'GET',
        userId: options.userId
      });
      
      return response.messages || [];
      
    } catch (error) {
      console.error(`Failed to get messages for thread ${threadId}:`, error.message);
      return [];
    }
  }

  // ==========================================
  // MESSAGE OPERATIONS
  // ==========================================

  /**
   * Store a new message via REST API
   * Using POST /threads/{thread_id} endpoint
   */
  async storeMessage(messageData) {
    const { threadId, senderId, content, contentType, attachments } = messageData;
    
    try {
      const response = await this.makeRequest(`/threads/${threadId}`, {
        method: 'POST',
        userId: senderId,
        body: JSON.stringify({
          sender_id: senderId,
          content,
          content_type: contentType || 'text/plain',
          attachment_ids: attachments || []
        })
      });

      return {
        id: response.message.id,
        senderName: response.message.sender_name,
        createdAt: response.message.created_at,
        updatedAt: response.message.updated_at,
        threadId: threadId,
        senderId: senderId,
        content: content,
        contentType: contentType || 'text/plain',
        ...response.message
      };

    } catch (error) {
      console.error('Failed to store message:', error.message);
      throw error;
    }
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(userId, fileData) {
    try {
      const formData = new FormData();
      formData.append('file', fileData);

      const response = await this.makeRequest('/attachments', {
        method: 'POST',
        userId,
        body: formData,
        headers: {
          // Remove Content-Type to let fetch set it with boundary for FormData
        }
      });

      return response.attachment;

    } catch (error) {
      console.error('Failed to upload attachment:', error.message);
      throw error;
    }
  }

  // ==========================================
  // READ RECEIPTS
  // ==========================================

  /**
   * Mark messages as read using POST /threads/{thread_id}/read
   */
  async markMessagesAsRead(userId, threadId, messageIds = null) {
    try {
      const body = messageIds && messageIds.length > 0 
        ? { message_id: messageIds[0] } // API seems to accept single message_id
        : {}; // Mark all messages in thread

      await this.makeRequest(`/threads/${threadId}/read`, {
        method: 'POST',
        userId,
        body: JSON.stringify(body)
      });

      return true;

    } catch (error) {
      console.error(`Failed to mark messages as read for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get read receipts for a message using GET /messages/{message_id}/receipts
   */
  async getMessageReadReceipts(messageId) {
    try {
      const response = await this.makeRequest(`/messages/${messageId}/receipts`, {
        method: 'GET'
      });
      
      return response.read_receipts || [];

    } catch (error) {
      console.error(`Failed to get read receipts for message ${messageId}:`, error.message);
      return [];
    }
  }

  // ==========================================
  // USER INFORMATION
  // ==========================================

  /**
   * Get user information using WordPress core API
   */
  async getUserInfo(userId) {
    try {
      // Use WordPress users API
      const response = await this.makeRequest(`/wp/v2/users/${userId}`, {
        method: 'GET',
        // Override the base URL for this request
        baseUrl: this.wpBaseUrl.replace('/wp-json', '') + '/wp-json'
      });

      return {
        id: response.id,
        name: response.name,
        displayName: response.display_name || response.name,
        avatar: response.avatar_urls ? response.avatar_urls['96'] : null,
        email: response.email, // Only available if current user or admin
        slug: response.slug
      };

    } catch (error) {
      console.error(`Failed to get user info for ${userId}:`, error.message);
      return {
        id: userId,
        name: `User ${userId}`,
        displayName: `User ${userId}`,
        avatar: null,
        slug: `user-${userId}`
      };
    }
  }

  /**
   * Validate if user can access a thread
   * This uses the threads endpoint to check access
   */
  async validateThreadAccess(userId, threadId) {
    try {
      // Try to get thread messages - if successful, user has access
      const messages = await this.getThreadMessages(threadId, { userId, limit: 1 });
      return true;
      
    } catch (error) {
      console.error(`Access validation failed for user ${userId}, thread ${threadId}:`, error.message);
      return false;
    }
  }

  // ==========================================
  // TYPING INDICATORS
  // ==========================================

  /**
   * Update typing status using POST /threads/{thread_id}/typing
   */
  async updateTypingStatus(userId, threadId, isTyping) {
    try {
      await this.makeRequest(`/threads/${threadId}/typing`, {
        method: 'POST',
        userId,
        body: JSON.stringify({ is_typing: isTyping })
      });

      return true;

    } catch (error) {
      console.error(`Failed to update typing status:`, error.message);
      return false;
    }
  }

  /**
   * Get typing status for thread using GET /threads/{thread_id}/typing
   */
  async getTypingStatus(threadId) {
    try {
      const response = await this.makeRequest(`/threads/${threadId}/typing`, {
        method: 'GET'
      });

      return response.typing_users || [];

    } catch (error) {
      console.error(`Failed to get typing status for thread ${threadId}:`, error.message);
      return [];
    }
  }

  // ==========================================
  // WEBHOOKS & NOTIFICATIONS
  // ==========================================

  /**
   * Send webhook notification for message
   */
  async sendWebhook(event, data) {
    // This could be used to trigger WordPress actions
    try {
      await this.makeRequest('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString()
        })
      });

    } catch (error) {
      console.error(`Failed to send webhook for ${event}:`, error.message);
    }
  }

  /**
   * Trigger WordPress action hook
   */
  async triggerWPAction(action, data) {
    try {
      await this.makeRequest('/actions', {
        method: 'POST',
        body: JSON.stringify({
          action,
          data
        })
      });

    } catch (error) {
      console.error(`Failed to trigger WordPress action ${action}:`, error.message);
    }
  }

  // ==========================================
  // BATCH OPERATIONS
  // ==========================================

  /**
   * Batch validate multiple thread accesses
   */
  async batchValidateAccess(userId, threadIds) {
    const results = new Map();
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < threadIds.length; i += batchSize) {
      const batch = threadIds.slice(i, i + batchSize);
      const promises = batch.map(async threadId => {
        const hasAccess = await this.validateThreadAccess(userId, threadId);
        return [threadId, hasAccess];
      });
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(([threadId, hasAccess]) => {
        results.set(threadId, hasAccess);
      });
    }
    
    return results;
  }

  /**
   * Batch get user information
   */
  async batchGetUsers(userIds) {
    const results = new Map();
    
    // Process in batches
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const promises = batch.map(async userId => {
        const userInfo = await this.getUserInfo(userId);
        return [userId, userInfo];
      });
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(([userId, userInfo]) => {
        results.set(userId, userInfo);
      });
    }
    
    return results;
  }

  // ==========================================
  // HEALTH & STATUS
  // ==========================================

  /**
   * Check if WordPress API is accessible
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('/', {
        method: 'GET'
      });
      
      return {
        status: 'ok',
        wordpressConnected: true,
        apiNamespace: this.apiNamespace,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'error',
        wordpressConnected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed API status and metrics
   */
  async getApiStatus() {
    try {
      const response = await this.makeRequest('/status', {
        method: 'GET'
      });

      return {
        ...response,
        healthy: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting API status:', error);
      return {
        error: error.message,
        healthy: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ==========================================
// CONFIGURATION HELPER
// ==========================================

/**
 * Create WordPress integration instance from environment variables
 */
export function createWordPressIntegration() {
  const config = {
    wpBaseUrl: process.env.WP_BASE_URL || 'http://localhost/wp/chatpulse/wp-json',
    apiNamespace: process.env.WP_API_NAMESPACE || 'chatpulse-chat/v1',
    apiKey: process.env.WP_API_KEY || null,
    timeout: parseInt(process.env.WP_API_TIMEOUT || '10000')
  };

  return new WordPressIntegration(config);
}

export default WordPressIntegration;
