import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Plus, Search, MoreVertical, Settings, LogOut } from 'lucide-react';
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

// Type definitions
interface ChatItem {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string | null;
  isBot: boolean;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot' | 'other';
  timestamp: Date;
}

interface MessagesState {
  [chatId: number]: Message[];
}

interface ChatAppProps {
  [key: string]: string;
}

const ChatApp: React.FC<ChatAppProps> = () => {
  const [activeChat, setActiveChat] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for chat list
  const [chatList] = useState<ChatItem[]>([
    {
      id: 1,
      name: "AI Assistant",
      lastMessage: "Hello! How can I help you today?",
      timestamp: "2m ago",
      unread: 0,
      avatar: null,
      isBot: true
    },
    {
      id: 2,
      name: "John Smith",
      lastMessage: "Thanks for the help yesterday!",
      timestamp: "1h ago",
      unread: 2,
      avatar: null,
      isBot: false
    },
    {
      id: 3,
      name: "Sarah Wilson",
      lastMessage: "Can we schedule a meeting?",
      timestamp: "3h ago",
      unread: 1,
      avatar: null,
      isBot: false
    },
    {
      id: 4,
      name: "Team Chat",
      lastMessage: "Great work everyone!",
      timestamp: "1d ago",
      unread: 0,
      avatar: null,
      isBot: false
    }
  ]);

  // Mock messages for each chat
  const [messages, setMessages] = useState<MessagesState>({
    1: [
      { id: 1, text: "Hello! How can I help you today?", sender: "bot", timestamp: new Date() },
    ],
    2: [
      { id: 1, text: "Hey! How are you doing?", sender: "user", timestamp: new Date(Date.now() - 3600000) },
      { id: 2, text: "I'm doing great! Thanks for asking.", sender: "other", timestamp: new Date(Date.now() - 3500000) },
      { id: 3, text: "Thanks for the help yesterday!", sender: "other", timestamp: new Date(Date.now() - 3000000) },
    ],
    3: [
      { id: 1, text: "Hi Sarah!", sender: "user", timestamp: new Date(Date.now() - 7200000) },
      { id: 2, text: "Can we schedule a meeting?", sender: "other", timestamp: new Date(Date.now() - 7000000) },
    ],
    4: [
      { id: 1, text: "Great work everyone!", sender: "other", timestamp: new Date(Date.now() - 86400000) },
    ]
  });

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), userMessage]
    }));
    setInputValue("");

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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const getAvatarFallback = (chat: ChatItem): string => {
    if (chat.isBot) return '';
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
  const currentMessages: Message[] = messages[activeChat] || [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
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
            <Button size="sm" className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
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
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
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
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 px-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && activeChat === 1 && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
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
            )}
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
      </div>
    </div>
  );
};

export default ChatApp;