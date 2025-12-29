import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, User, Bot, Plus, Search, MoreVertical, Settings, LogOut, Wifi, WifiOff, X, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { chatService, type ChatThread, type ChatParticipant } from './ChatService';

// Local ChatItem interface for UI state

interface ChatItem {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string | null;
  isBot: boolean;
  type: 'private' | 'group';
  participantIds?: number[]; // For tracking presence
  isOnline?: boolean;
  lastSeen?: string;
}

interface Message {
  id: number | string;
  text: string;
  sender: 'user' | 'bot' | 'other';
  timestamp: Date;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  isOptimistic?: boolean;
}

interface MessagesState {
  [chatId: number]: Message[];
}

interface User {
  id: number;
  name: string;
  avatar?: string;
}

interface ChatAppProps {
  [key: string]: string;
}

// Skeleton components for loading states
const ChatListSkeleton = () => (
  <div className="p-2 space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center p-3 rounded-lg">
        <Skeleton className="h-12 w-12 rounded-full mr-3" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const UserListSkeleton = () => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center p-4">
        <Skeleton className="h-12 w-12 rounded-full mr-4" />
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </div>
);

const MessageSkeleton = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <div className={`flex ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-end space-x-2 max-w-xs lg:max-w-md`}>
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-40'} rounded-lg`} />
        </div>
      </div>
    ))}
  </div>
);

const ChatApp: React.FC<ChatAppProps> = () => {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [messages, setMessages] = useState<MessagesState>({});
  const [users, setUsers] = useState<User[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState({
    chats: true,
    users: false,
    messages: false
  });
  const [showNewMessageNotification, setShowNewMessageNotification] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const markedAsReadRef = useRef<Set<number>>(new Set()); // Track messages already marked as read
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);

  // Current user ID (get from WordPress API settings)
  const currentUserId = (window as any).wpApiSettings?.currentUser?.id || 1;

  // Helper function to convert thread to chat item
  const convertThreadToChatItem = useCallback((thread: ChatThread): ChatItem => {
    const timeAgo = (date: string) => {
      const now = new Date();
      const threadDate = new Date(date);
      const diffInMinutes = Math.floor((now.getTime() - threadDate.getTime()) / (1000 * 60));

      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    // Get participant IDs (exclude current user)
    const participantIds = thread.participants
      ?.map((p: any) => p.user_id || p.id)
      .filter((id: number) => id !== currentUserId) || [];

    // Check online status for the other participant (in private chats)
    const otherUserId = participantIds[0];
    const isOnline = otherUserId ? chatService.isUserOnline(otherUserId) : false;
    const lastSeen = otherUserId ? chatService.getLastSeen(otherUserId) : undefined;

    // For private threads, show the other user's name
    let threadName = thread.title || `Thread ${thread.id}`;
    if (thread.type === 'private' && thread.participants) {
      const otherParticipant = thread.participants.find(
        (p: any) => (p.user_id || p.id) !== currentUserId
      );
      if (otherParticipant) {
        threadName = otherParticipant.display_name || otherParticipant.name || threadName;
      }
    }

    return {
      id: thread.id,
      name: threadName,
      lastMessage: thread.last_message?.content || 'No messages yet',
      timestamp: timeAgo(thread.last_message?.created_at || thread.created_at),
      unread: thread.unread_count || 0,
      avatar: null,
      isBot: false,
      type: thread.type,
      participantIds,
      isOnline,
      lastSeen
    };
  }, [currentUserId]);

  // Initialize chat service
  useEffect(() => {
    let isInitialized = false;

    const initializeChat = async () => {
      if (isInitialized) return;
      isInitialized = true;

      // Check if WordPress settings are available
      if (!currentUserId || currentUserId === 1) {
        console.warn('WordPress user not found, using fallback mode');
        setIsConnected(false);
        setIsLoading((prev) => ({ ...prev, chats: false }));
        return;
      }

      try {
        await chatService.initialize(currentUserId, {
          onConnectionStatusChanged: (connected) => {
            setIsConnected(connected);
            console.log('Connection status:', connected ? 'Connected' : 'Disconnected');
          },

          onThreadsLoaded: (loadedThreads) => {
            console.log('Threads loaded:', loadedThreads);
            // Convert API threads to chat items
            const chatItems = loadedThreads.map(convertThreadToChatItem);
            setChatList(chatItems);
            setIsLoading((prev) => ({ ...prev, chats: false }));

            // Set first thread as active if no active chat
            if (chatItems.length > 0 && !activeChat) {
              setActiveChat(chatItems[0].id);
            }

            // Request presence for all participants in threads
            const allParticipantIds = new Set<number>();
            loadedThreads.forEach((thread: ChatThread) => {
              if (thread.participants) {
                thread.participants.forEach((p: ChatParticipant) => {
                  if (p.user_id !== currentUserId) {
                    allParticipantIds.add(p.user_id);
                  }
                });
              }
            });
            
            if (allParticipantIds.size > 0) {
              const participantArray = Array.from(allParticipantIds);
              console.log('Requesting presence for participants:', participantArray);
              chatService.requestPresence(participantArray);
            }
          },

          onMessagesLoaded: (threadId, loadedMessages) => {
            setIsLoading((prev) => ({ ...prev, messages: false }));
            // Convert API messages to local format
            const convertedMessages: Message[] = loadedMessages.map(msg => ({
              id: msg.id,
              text: msg.content,
              sender: msg.sender_id === currentUserId ? 'user' : 'other',
              timestamp: new Date(msg.created_at),
              status: msg.status as any
            }));

            setMessages(prev => ({
              ...prev,
              [threadId]: convertedMessages
            }));
          },

          onMessageReceived: (message) => {
            // Skip if this message already exists (prevent duplicates from webhooks)
            setMessages(prev => {
              const threadMessages = prev[message.thread_id] || [];
              const messageExists = threadMessages.some(m => m.id === message.id);
              
              if (messageExists) {
                console.log('Message already exists, skipping:', message.id);
                return prev;
              }

              // Convert API message to local format
              const convertedMessage: Message = {
                id: message.id,
                text: message.content,
                sender: message.sender_id === currentUserId ? 'user' : 'other',
                timestamp: new Date(message.created_at),
                status: message.status as any,
                isOptimistic: message.isOptimistic
              };

              return {
                ...prev,
                [message.thread_id]: [...threadMessages, convertedMessage]
              };
            });

            // Update chat list with latest message
            updateChatListWithMessage(message);
          },

          onMessageConfirmed: (tempId, realId) => {
            // Update optimistic message with real ID
            setMessages(prev => {
              const newMessages = { ...prev };
              Object.keys(newMessages).forEach(threadId => {
                const threadIdNum = parseInt(threadId);
                if (!newMessages[threadIdNum]) {
                  newMessages[threadIdNum] = [];
                }
                newMessages[threadIdNum] = newMessages[threadIdNum].map(msg => {
                  if (msg.id === tempId) {
                    return { ...msg, id: realId, status: 'sent', isOptimistic: false };
                  }
                  return msg;
                });
              });
              return newMessages;
            });
          },

          onTypingStatusChanged: (typing) => {
            setTypingUsers(prev => {
              const newTypingUsers = new Map(prev);
              if (!newTypingUsers.has(typing.thread_id)) {
                newTypingUsers.set(typing.thread_id, new Set());
              }

              const threadTyping = newTypingUsers.get(typing.thread_id)!;
              if (typing.is_typing) {
                threadTyping.add(typing.user_id);
              } else {
                threadTyping.delete(typing.user_id);
              }

              if (threadTyping.size === 0) {
                newTypingUsers.delete(typing.thread_id);
              }

              return newTypingUsers;
            });
          },

          onReadReceiptReceived: (receipt) => {
            console.log('Read receipt received:', receipt);
            // Update message status to 'read'
            setMessages(prev => {
              const newMessages = { ...prev };
              Object.keys(newMessages).forEach(threadId => {
                const threadIdNum = parseInt(threadId);
                if (!newMessages[threadIdNum]) {
                  newMessages[threadIdNum] = [];
                }
                newMessages[threadIdNum] = newMessages[threadIdNum].map(msg => {
                  if (msg.id === receipt.message_id) {
                    return { ...msg, status: 'read' };
                  }
                  return msg;
                });
              });
              return newMessages;
            });
          },

          onUserPresenceChanged: (presence) => {
            console.log('User presence changed:', presence);
            // Update chat list with new presence info
            setChatList(prev => {
              const updated = prev.map(chat => {
                if (chat.participantIds?.includes(presence.user_id)) {
                  const newLastSeen = chatService.getLastSeen(presence.user_id);
                  console.log(`Updating chat ${chat.id}: isOnline=${presence.status === 'online'}, lastSeen=${newLastSeen}`);
                  return {
                    ...chat,
                    isOnline: presence.status === 'online',
                    lastSeen: newLastSeen
                  };
                }
                return chat;
              });
              return updated;
            });
          },

          onBulkPresenceUpdate: (presences) => {
            console.log('Bulk presence update:', presences.size);
            // Update all chats with presence info
            setChatList(prev => prev.map(chat => {
              const otherUserId = chat.participantIds?.[0];
              if (otherUserId && presences.has(otherUserId)) {
                return {
                  ...chat,
                  isOnline: chatService.isUserOnline(otherUserId),
                  lastSeen: chatService.getLastSeen(otherUserId)
                };
              }
              return chat;
            }));
          },

          onError: (error) => {
            console.error('Chat service error:', error);
            setIsLoading((prev) => ({ ...prev, chats: false, users: false, messages: false }));
          }
        });

        // Join the active chat and load threads
        await chatService.loadThreads();

        if (activeChat) {
          chatService.joinThread(activeChat);
          setIsLoading((prev) => ({ ...prev, messages: true }));
          await chatService.loadMessages(activeChat);
        }

      } catch (error) {
        console.error('Failed to initialize chat service:', error);
        setIsLoading((prev) => ({ ...prev, chats: false, users: false, messages: false }));
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      chatService.disconnect();
    };
  }, [currentUserId]);

  // Handle active chat changes
  useEffect(() => {
    if (activeChat && chatService.isConnected()) {
      // Leave previous thread if any
      // Join new thread
      chatService.joinThread(activeChat);
      setIsLoading((prev) => ({ ...prev, messages: true }));

      // Load messages for this thread
      chatService.loadMessages(activeChat);
    }
  }, [activeChat]);

  // Mark messages as read when viewing them
  useEffect(() => {
    if (activeChat && chatService.isConnected()) {
      const threadMessages = messages[activeChat] || [];
      
      if (threadMessages.length > 0) {
        // Get unread message IDs from other users that haven't been marked yet
        const unreadMessageIds = threadMessages
          .filter(msg => 
            msg.sender !== 'user' && 
            msg.status !== 'read' && 
            !markedAsReadRef.current.has(msg.id as number)
          )
          .map(msg => msg.id as number);

        if (unreadMessageIds.length > 0) {
          // Mark messages as read after a short delay (user has viewed them)
          const timer = setTimeout(() => {
            chatService.markMessagesRead(activeChat, unreadMessageIds);
            
            // Add to marked set to prevent re-marking
            unreadMessageIds.forEach(id => markedAsReadRef.current.add(id));
            
            console.log('Marked messages as read:', unreadMessageIds);
          }, 1000); // 1 second delay to ensure user is actually viewing

          return () => clearTimeout(timer);
        }
      }
    }
  }, [activeChat, messages, chatService]);

  // Check if scroll is at bottom
  const checkIfAtBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      isAtBottomRef.current = isAtBottom;
      
      // Hide notification if at bottom
      if (isAtBottom) {
        setShowNewMessageNotification(false);
        setNewMessageCount(0);
      }
      
      return isAtBottom;
    }
    return true;
  }, []);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
      isAtBottomRef.current = true;
      setShowNewMessageNotification(false);
      setNewMessageCount(0);
    }
  }, []);

  // Auto-scroll to bottom when messages change (only if already at bottom)
  useEffect(() => {
    const currentMessages = activeChat ? (messages[activeChat] || []) : [];
    if (currentMessages.length > 0) {
      if (isAtBottomRef.current) {
        // User is at bottom, auto-scroll
        scrollToBottom(true);
      } else {
        // User is scrolled up, show notification
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (lastMessage.sender !== 'user') {
          setShowNewMessageNotification(true);
          setNewMessageCount(prev => prev + 1);
        }
      }
    }
  }, [messages, activeChat, scrollToBottom]);

  // Scroll to bottom when changing threads
  useEffect(() => {
    if (activeChat) {
      scrollToBottom(false); // Instant scroll when switching chats
      setShowNewMessageNotification(false);
      setNewMessageCount(0);
    }
  }, [activeChat, scrollToBottom]);

  // Typing indicator timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTypingStart = useCallback(() => {
    if (activeChat && chatService.isConnected()) {
      chatService.setTyping(activeChat, true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        chatService.setTyping(activeChat, false);
      }, 1000);
    }
  }, [activeChat]);

  const sendMessage = useCallback(() => {
    if (!inputValue.trim() || !activeChat) return;

    if (chatService.isConnected()) {
      // Send via WebSocket with optimistic update
      const tempId = chatService.sendMessage(activeChat, inputValue);
      console.log('Message sent with temp ID:', tempId);
    } else {
      // Fallback: create local message for demo
      const userMessage: Message = {
        id: Date.now(),
        text: inputValue,
        sender: "user",
        timestamp: new Date(),
        status: 'pending'
      };

      setMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), userMessage]
      }));

      // Simulate bot response only for AI Assistant (chat id 1)
      if (activeChat === 1) {
        setIsTyping(true);
        setTimeout(() => {
          const botMessage: Message = {
            id: Date.now() + 1,
            text: "Thanks for your message! This is a simulated response from the AI assistant.",
            sender: "bot",
            timestamp: new Date()
          };
          setMessages(prev => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), botMessage]
          }));
          setIsTyping(false);
        }, 1500);
      }
    }

    setInputValue("");

    // Stop typing indicator
    if (chatService.isConnected()) {
      chatService.setTyping(activeChat, false);
    }
  }, [inputValue, activeChat]);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    sendMessage();
  };

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleChatClick = (chatId: number): void => {
    setActiveChat(chatId);
    
    // Reset unread count for this chat
    setChatList(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, unread: 0 } : chat
    ));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
    handleTypingStart();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper function to make API requests
  const makeApiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const url = `${(window as any).wpApiSettings.root}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': (window as any).wpApiSettings.nonce
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
  }, []);

  // Load users from our custom chat API
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading((prev) => ({ ...prev, users: true }));
      
      // Build URL with query parameters
      const searchParams = new URLSearchParams({
        exclude: String(currentUserId),
        per_page: '100'
      });
      
      const userList = await makeApiRequest(`wplc-chat/v1/users?${searchParams.toString()}`);
      
      setUsers(userList.map((user: any) => ({
        id: user.id,
        name: user.display_name || user.name,
        avatar: user.avatar_url || user.avatar_urls?.['96'] || null
      })));
      
      setIsLoading((prev) => ({ ...prev, users: false }));
    } catch (error) {
      console.error('Failed to load users:', error);
      setIsLoading((prev) => ({ ...prev, users: false }));
    }
  }, [makeApiRequest, currentUserId]);

  // Handle opening the user dialog
  const handleOpenUserDialog = useCallback(async () => {
    if (!chatService.isConnected()) {
      console.warn('Cannot create thread: not connected to chat service');
      return;
    }

    setShowUserDialog(true);
    await loadUsers();
  }, [chatService, loadUsers]);

  // Handle creating a new thread with selected user
  const handleCreateThreadWithUser = useCallback(async (user: User) => {
    if (!chatService.isConnected()) {
      console.warn('Cannot create thread: not connected to chat service');
      return;
    }

    if (!user) {
      console.warn('No user provided to create thread with');
      return;
    }

    try {
      // Create a new private thread with current user and selected user
      const newThread = await chatService.createThread(
        'private',
        [currentUserId, user.id],
        user.name
      );

      if (newThread) {
        // Convert to chat item and add to list
        const newChatItem = convertThreadToChatItem(newThread);
        setChatList(prev => [newChatItem, ...prev]);

        // Set as active chat
        setActiveChat(newThread.id);

        // Close dialog and reset selection
        setShowUserDialog(false);
        setSelectedUser(null);

        console.log('New thread created:', newThread);
      }
    } catch (error) {
      console.error('Failed to create new thread:', error);
    }
  }, [chatService, convertThreadToChatItem, currentUserId]);

  const updateChatListWithMessage = useCallback((message: any) => {
    setChatList(prev => prev.map(chat => {
      if (chat.id === message.thread_id) {
        // Increment unread count if message is from another user and thread is not active
        const shouldIncrementUnread = 
          message.sender_id !== currentUserId && 
          activeChat !== message.thread_id;
        
        return {
          ...chat,
          lastMessage: message.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ago',
          unread: shouldIncrementUnread ? (chat.unread + 1) : chat.unread
        };
      }
      return chat;
    }));
  }, [currentUserId, activeChat]);

  const getAvatarFallback = (chat: ChatItem): string => {
    if (chat?.isBot) return '';
    return chat.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getMessageAvatarFallback = (message: Message, currentChat: ChatItem | undefined): string => {
    if (message.sender === 'user') return '';
    if (message.sender === 'bot') return '';
    return currentChat?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  };

  const filteredChats: ChatItem[] = chatList.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUsers: User[] = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentChat: ChatItem | undefined = useMemo(() => {
    const chat = chatList.find(chat => chat.id === activeChat);
    if (chat) {
      console.log('Current chat updated:', { 
        id: chat.id, 
        name: chat.name, 
        isOnline: chat.isOnline, 
        lastSeen: chat.lastSeen 
      });
    }
    return chat;
  }, [chatList, activeChat]);
  
  const currentMessages: Message[] = activeChat ? (messages[activeChat] || []) : [];

  return (
    <div className="flex h-[600px] bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              {/* Connection Status Indicator */}
              <div className="flex items-center">
                {isConnected ? (
                  <div title="Connected">
                    <Wifi className="h-4 w-4 text-green-500" />
                  </div>
                ) : (
                  <div title="Disconnected">
                    <WifiOff className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleOpenUserDialog} size="sm" variant="default" disabled={!isConnected}>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {isLoading.chats ? (
            <ChatListSkeleton />
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No conversations yet</p>
              <Button
                onClick={handleOpenUserDialog}
                variant="outline"
                size="sm"
                disabled={!isConnected}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start a chat
              </Button>
            </div>
          ) : (
            <div className="p-2">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    activeChat === chat.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative mr-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar || undefined} />
                      <AvatarFallback>
                        {chat.isBot ? (
                          <Bot className="h-6 w-6" />
                        ) : (
                          getAvatarFallback(chat)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator */}
                    {!chat.isBot && chat.isOnline && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {chat.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage}
                      </p>
                      {chat.unread > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2 flex-shrink-0">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat && currentChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentChat?.avatar || undefined} />
                    <AvatarFallback>
                      {currentChat?.isBot ? (
                        <Bot className="h-5 w-5" />
                      ) : (
                        getAvatarFallback(currentChat!)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator */}
                  {!currentChat?.isBot && currentChat?.isOnline && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{currentChat?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {currentChat?.isBot 
                      ? 'AI Assistant' 
                      : currentChat?.isOnline 
                        ? 'Online' 
                        : currentChat?.lastSeen || 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            {isLoading.messages ? (
              <MessageSkeleton />
            ) : (
              <div className="flex-1 overflow-hidden relative">
                <div 
                  ref={scrollContainerRef}
                  className="h-full overflow-y-auto"
                  onScroll={checkIfAtBottom}
                >
                  <div className="space-y-4 p-4">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      <div className={`flex max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                        } items-end space-x-2`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {message.sender === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : message.sender === 'bot' ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              getMessageAvatarFallback(message, currentChat)
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div
                            className={`px-3 py-2 rounded-lg ${message.sender === 'user'
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                              } ${message.isOptimistic ? 'opacity-70' : ''}`}
                          >
                            <p className="text-sm">{message.text}</p>
                            {/* Message Status Indicator */}
                            {message.sender === 'user' && (
                              <div className="flex items-center justify-end mt-1">
                                {message.status === 'pending' && (
                                  <span className="text-xs opacity-75">⏳</span>
                                )}
                                {message.status === 'sent' && (
                                  <span className="text-xs opacity-75">✓</span>
                                )}
                                {message.status === 'delivered' && (
                                  <span className="text-xs opacity-75 text-gray-300">✓✓</span>
                                )}
                                {message.status === 'read' && (
                                  <span className="text-xs opacity-90 text-blue-300">✓✓</span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 mt-1 px-1">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {activeChat !== null && ((isTyping && activeChat === 1) || (activeChat && typingUsers.has(activeChat) && typingUsers.get(activeChat)?.size && typingUsers.get(activeChat)!.size > 0)) ? (
                    <div className="flex justify-start">
                      <div className="flex items-end space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {isTyping && activeChat === 1 ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 px-3 py-2 rounded-lg rounded-bl-none">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                    <div/>
                  </div>
                </div>
                
                {/* New Message Notification */}
                {showNewMessageNotification && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <button
                      onClick={() => scrollToBottom(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transition-all animate-bounce"
                    >
                      <span className="text-sm font-medium">
                        {newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}
                      </span>
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={isTyping}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-500 mb-4">Choose a conversation from the sidebar or start a new one</p>
              <Button
                onClick={handleOpenUserDialog}
                disabled={!isConnected}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start new conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Selection Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Start a new conversation</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Select a user to start a conversation with
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
          <ScrollArea className="mt-4 max-h-80">
            {isLoading.users ? (
              <UserListSkeleton />
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedUser?.id === user.id ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => handleCreateThreadWithUser(user)}
                  >
                    <Avatar className="h-12 w-12 mr-4">
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : (
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatApp;