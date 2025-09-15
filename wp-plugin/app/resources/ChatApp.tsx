import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Bot, Plus, Search, MoreVertical, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';
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
import { chatService } from './ChatService';

// Type definitions
interface ChatThread {
  id: number;
  type: 'private' | 'group';
  title: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  participants?: any[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: number;
  };
  unread_count?: number;
}

interface ChatItem {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string | null;
  isBot: boolean;
  type: 'private' | 'group';
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

interface ChatAppProps {
  [key: string]: string;
}

const ChatApp: React.FC<ChatAppProps> = () => {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [messages, setMessages] = useState<MessagesState>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Current user ID (get from WordPress API settings)
  const currentUserId = (window as any).wpApiSettings?.currentUser?.id || 1;

  // Helper function to convert thread to chat item
  const convertThreadToChatItem = (thread: ChatThread): ChatItem => {
    const timeAgo = (date: string) => {
      const now = new Date();
      const threadDate = new Date(date);
      const diffInMinutes = Math.floor((now.getTime() - threadDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return {
      id: thread.id,
      name: thread.title || `Thread ${thread.id}`,
      lastMessage: thread.last_message?.content || 'No messages yet',
      timestamp: timeAgo(thread.last_message?.created_at || thread.created_at),
      unread: thread.unread_count || 0,
      avatar: null,
      isBot: false,
      type: thread.type
    };
  };

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
            
            // Set first thread as active if no active chat
            if (chatItems.length > 0 && !activeChat) {
              setActiveChat(chatItems[0].id);
            }
          },
          
          onMessagesLoaded: (threadId, loadedMessages) => {
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
            // Convert API message to local format
            const convertedMessage: Message = {
              id: message.id,
              text: message.content,
              sender: message.sender_id === currentUserId ? 'user' : 'other',
              timestamp: new Date(message.created_at),
              status: message.status as any,
              isOptimistic: message.isOptimistic
            };
            
            setMessages(prev => ({
              ...prev,
              [message.thread_id]: [...(prev[message.thread_id] || []), convertedMessage]
            }));

            // Update chat list with latest message
            updateChatListWithMessage(message);
          },
          
          onMessageConfirmed: (tempId, realId) => {
            // Update optimistic message with real ID
            setMessages(prev => {
              const newMessages = { ...prev };
              Object.keys(newMessages).forEach(threadId => {
                newMessages[parseInt(threadId)] = newMessages[parseInt(threadId)].map(msg => {
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
          
          onError: (error) => {
            console.error('Chat service error:', error);
            // Show error notification to user
          }
        });

        // Join the active chat and load threads
        await chatService.loadThreads();
        
        if (activeChat) {
          chatService.joinThread(activeChat);
          await chatService.loadMessages(activeChat);
        }

      } catch (error) {
        console.error('Failed to initialize chat service:', error);
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
      
      // Load messages for this thread
      chatService.loadMessages(activeChat);
    }
  }, [activeChat]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat, scrollToBottom]);

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

  const createNewThread = useCallback(async () => {
    if (!chatService.isConnected()) {
      console.warn('Cannot create thread: not connected to chat service');
      return;
    }

    try {
      // Create a new private thread with current user as participant
      const newThread = await chatService.createThread('private', [currentUserId], `New Chat ${Date.now()}`);

      if (newThread) {
        // Convert to chat item and add to list
        const newChatItem = convertThreadToChatItem(newThread);
        setChatList(prev => [newChatItem, ...prev]);
        
        // Set as active chat
        setActiveChat(newThread.id);
        
        console.log('New thread created:', newThread);
      }
    } catch (error) {
      console.error('Failed to create new thread:', error);
    }
  }, [convertThreadToChatItem, currentUserId]);

  const updateChatListWithMessage = useCallback((message: any) => {
    setChatList(prev => prev.map(chat => {
      if (chat.id === message.thread_id) {
        return {
          ...chat,
          lastMessage: message.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ago'
        };
      }
      return chat;
    }));
  }, []);

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

  const currentChat: ChatItem | undefined = chatList.find(chat => chat.id === activeChat);
  const currentMessages: Message[] = activeChat ? (messages[activeChat] || []) : [];

  return (
    <div className="flex h-screen bg-gray-50">
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
            <Button size="sm" className="shrink-0" onClick={createNewThread}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No conversations yet</p>
                <Button 
                  onClick={createNewThread}
                  variant="outline" 
                  size="sm"
                  disabled={!isConnected}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start a chat
                </Button>
              </div>
            ) : (
              filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  activeChat === chat.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage src={chat.avatar || undefined} />
                  <AvatarFallback>
                    {chat.isBot ? (
                      <Bot className="h-6 w-6" />
                    ) : (
                      getAvatarFallback(chat)
                    )}
                  </AvatarFallback>
                </Avatar>
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
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat && currentChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
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
                <div>
                  <h3 className="font-medium text-gray-900">{currentChat?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {currentChat?.isBot ? 'AI Assistant' : 'Online'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
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
                      className={`px-3 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      } ${message.isOptimistic ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm">{message.text}</p>
                      {/* Message Status Indicator */}
                      {message.sender === 'user' && (
                        <div className="flex items-center justify-end mt-1">
                          <span className="text-xs opacity-75">
                            {message.status === 'pending' && '⏳'}
                            {message.status === 'sent' && '✓'}
                            {message.status === 'delivered' && '✓✓'}
                            {message.status === 'read' && '✓✓'}
                          </span>
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
            {activeChat && ((isTyping && activeChat === 1) || (typingUsers.has(activeChat) && typingUsers.get(activeChat)!.size > 0)) ? (
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
            <div ref={messagesEndRef} />
          </div>
            </ScrollArea>

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
                onClick={createNewThread}
                disabled={!isConnected}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start new conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};export default ChatApp;