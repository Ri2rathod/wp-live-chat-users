// socket-server/wordpress-integration.js
// WordPress REST API integration utilities for Socket.IO server

import fetch from 'node-fetch'; // You may need to install: npm install node-fetch

class WordPressIntegration {
  constructor(config = {}) {
    this.wpBaseUrl = config.wpBaseUrl || 'http://localhost/wp-json';
    this.apiNamespace = config.apiNamespace || 'wplc-chat/v1';
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

    // Add authentication if available
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
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
    const url = `${this.baseApiUrl}${endpoint}`;
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
  // THREAD VALIDATION
  // ==========================================

  /**
   * Validate if user can access a thread
   */
  async validateThreadAccess(userId, threadId) {
    try {
      const response = await this.makeRequest(`/threads/${threadId}`, {
        method: 'GET',
        userId
      });
      
      // If we get the thread data, user has access
      return response && response.thread;
      
    } catch (error) {
      console.error(`Access validation failed for user ${userId}, thread ${threadId}:`, error.message);
      return false;
    }
  }

  /**
   * Get thread participants
   */
  async getThreadParticipants(threadId) {
    try {
      // This endpoint doesn't exist yet in your API, but you might add it
      const response = await this.makeRequest(`/threads/${threadId}/participants`);
      return response.participants || [];
      
    } catch (error) {
      console.error(`Failed to get thread participants for ${threadId}:`, error.message);
      return [];
    }
  }

  // ==========================================
  // MESSAGE OPERATIONS
  // ==========================================

  /**
   * Store a new message via REST API
   */
  async storeMessage(messageData) {
    const { threadId, senderId, content, contentType, attachments } = messageData;
    
    try {
      const response = await this.makeRequest(`/threads/${threadId}/messages`, {
        method: 'POST',
        userId: senderId,
        body: JSON.stringify({
          content,
          content_type: contentType,
          attachment_ids: attachments
        })
      });

      return {
        id: response.message.id,
        senderName: response.message.sender_name,
        createdAt: response.message.created_at,
        updatedAt: response.message.updated_at,
        ...messageData
      };

    } catch (error) {
      console.error('Failed to store message:', error.message);
      throw error;
    }
  }

  /**
   * Update message status
   */
  async updateMessage(messageId, updates) {
    try {
      // This endpoint doesn't exist yet, but you might add it
      const response = await this.makeRequest(`/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      return response.message;

    } catch (error) {
      console.error(`Failed to update message ${messageId}:`, error.message);
      throw error;
    }
  }

  // ==========================================
  // READ RECEIPTS
  // ==========================================

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId, threadId, messageIds) {
    try {
      // Mark individual messages or all in thread
      if (messageIds && messageIds.length > 0) {
        // Mark specific messages
        const promises = messageIds.map(messageId => 
          this.makeRequest(`/threads/${threadId}/read`, {
            method: 'POST',
            userId,
            body: JSON.stringify({ message_id: messageId })
          })
        );
        
        await Promise.all(promises);
      } else {
        // Mark all messages in thread
        await this.makeRequest(`/threads/${threadId}/read`, {
          method: 'POST',
          userId,
          body: JSON.stringify({})
        });
      }

      return true;

    } catch (error) {
      console.error(`Failed to mark messages as read for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get read receipts for a message
   */
  async getMessageReadReceipts(messageId) {
    try {
      const response = await this.makeRequest(`/messages/${messageId}/receipts`);
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
   * Get user information
   */
  async getUserInfo(userId) {
    try {
      // Use WordPress users API
      const response = await this.makeRequest(`/wp/v2/users/${userId}`, {
        baseUrl: this.wpBaseUrl // Override base URL for WP core API
      });

      return {
        id: response.id,
        name: response.name,
        displayName: response.display_name || response.name,
        avatar: response.avatar_urls ? response.avatar_urls['96'] : null,
        email: response.email // Only available if current user or admin
      };

    } catch (error) {
      console.error(`Failed to get user info for ${userId}:`, error.message);
      return {
        id: userId,
        name: `User ${userId}`,
        displayName: `User ${userId}`,
        avatar: null
      };
    }
  }

  // ==========================================
  // TYPING INDICATORS
  // ==========================================

  /**
   * Store typing status (using WordPress transients via REST)
   */
  async updateTypingStatus(userId, threadId, isTyping) {
    try {
      // This would require a custom endpoint in your WordPress plugin
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

  // ==========================================
  // HEALTH CHECK
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
}

// ==========================================
// CONFIGURATION HELPER
// ==========================================

/**
 * Create WordPress integration instance from environment variables
 */
export function createWordPressIntegration() {
  const config = {
    wpBaseUrl: process.env.WP_BASE_URL || 'http://localhost/wp-json',
    apiNamespace: process.env.WP_API_NAMESPACE || 'wplc-chat/v1',
    apiKey: process.env.WP_API_KEY || null,
    timeout: parseInt(process.env.WP_API_TIMEOUT || '10000')
  };

  return new WordPressIntegration(config);
}

export default WordPressIntegration;
