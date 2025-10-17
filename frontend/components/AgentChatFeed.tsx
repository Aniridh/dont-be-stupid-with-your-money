'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Bot, User, Clock, Activity } from 'lucide-react';

interface ChatMessage {
  id: string;
  timestamp: string;
  type: 'agent' | 'system' | 'user';
  message: string;
  symbol?: string;
  action?: string;
  confidence?: number;
}

interface AgentChatFeedProps {
  isLiveMode?: boolean;
}

export default function AgentChatFeed({ isLiveMode = false }: AgentChatFeedProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with some demo messages
    const demoMessages: ChatMessage[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'agent',
        message: 'FinSage Agent detected high P/E ratio in AAPL. Suggesting position reduction.',
        symbol: 'AAPL',
        action: 'reduce_position',
        confidence: 0.85
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        type: 'system',
        message: 'Portfolio drift analysis complete. Current drift: 5.2%'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        type: 'agent',
        message: 'TSLA showing RSI oversold signals. Consider increasing position.',
        symbol: 'TSLA',
        action: 'consider_buy',
        confidence: 0.72
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        type: 'system',
        message: 'News sentiment analysis updated for portfolio holdings.'
      }
    ];
    setMessages(demoMessages);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'agent',
        message: 'Monitoring market conditions...',
        confidence: 0.5
      };
      setMessages(prev => [...prev.slice(-9), newMessage]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Activity className="h-4 w-4 text-gray-500" />;
      case 'user':
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'agent':
        return 'bg-blue-50 border-blue-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      case 'user':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'reduce_position':
      case 'sell':
        return 'text-red-600 bg-red-100';
      case 'consider_buy':
      case 'increase_position':
        return 'text-green-600 bg-green-100';
      case 'hold':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Agent Collaboration</h2>
        <div className="flex items-center space-x-2">
          {isLiveMode ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              STUB
            </span>
          )}
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="h-80 overflow-y-auto space-y-3 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`border rounded-lg p-3 ${getMessageColor(message.type)}`}
          >
            <div className="flex items-start space-x-2">
              {getMessageIcon(message.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {message.type === 'agent' ? 'FinSage Agent' : 
                     message.type === 'system' ? 'System' : 'User'}
                  </span>
                  {message.symbol && (
                    <span className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded">
                      {message.symbol}
                    </span>
                  )}
                  {message.action && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(message.action)}`}>
                      {message.action.replace('_', ' ')}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {message.confidence && (
                      <div className="flex items-center space-x-1">
                        <div className="w-12 bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${message.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(message.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(message.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Real-time agent collaboration</span>
          <span>{messages.length} messages</span>
        </div>
      </div>
    </div>
  );
}
