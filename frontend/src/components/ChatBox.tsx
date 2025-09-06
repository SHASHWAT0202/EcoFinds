// ChatBox component - Simple chat interface with polling
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';

interface Message {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
  senderUsername: string;
  isOwnMessage: boolean;
}

interface ChatBoxProps {
  conversationId: string;
  otherUserId: number;
  otherUsername: string;
  productId?: number;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  conversationId,
  otherUserId,
  otherUsername,
  productId
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    fetchMessages(); // Initial fetch

    return () => clearInterval(interval);
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      // TODO: Fetch from API
      console.log('Fetching messages for conversation:', conversationId);
      
      // Mock data for now
      const mockMessages: Message[] = [
        {
          id: 1,
          senderId: otherUserId,
          content: `Hi! I'm interested in your product.`,
          createdAt: new Date().toISOString(),
          senderUsername: otherUsername,
          isOwnMessage: false
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      // TODO: Send message via API
      console.log('Sending message:', {
        receiverId: otherUserId,
        content: newMessage,
        productId
      });

      // Mock successful send
      const mockMessage: Message = {
        id: Date.now(),
        senderId: 1, // Current user ID
        content: newMessage,
        createdAt: new Date().toISOString(),
        senderUsername: 'You',
        isOwnMessage: true
      };

      setMessages(prev => [...prev, mockMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          <MessageCircle className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{otherUsername}</h3>
          <p className="text-sm text-gray-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Start a conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`message-bubble ${
                  message.isOwnMessage ? 'message-sent' : 'message-received'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-center space-x-2 p-4 border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className="btn btn-primary p-2 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
