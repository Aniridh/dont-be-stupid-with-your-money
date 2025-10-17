"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export default function FinSageChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: "assistant", 
      content: "Hi! I'm FinSage 👋 — ask me about any stock or portfolio insight.",
      timestamp: new Date().toISOString()
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage: ChatMessage = { 
      role: "user", 
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          context: {
            portfolio: "AAPL, TSLA, SPY, MSFT",
            mode: "stub"
          }
        }),
      });
      
      const data = await res.json();
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply || "I couldn't generate a response. Please try again.",
        timestamp: new Date().toISOString()
      };
      
      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I couldn't reach the FinSage agent right now. Please try again later.",
        timestamp: new Date().toISOString()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickQuestions = [
    "What's AAPL's current risk level?",
    "Should I rebalance my portfolio?",
    "How is TSLA performing?",
    "What's the market sentiment?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-[90vh] bg-white rounded-2xl border shadow-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Bot className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">FinSage Chat</h3>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            LIVE
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "assistant" 
                  ? "bg-gray-100 text-gray-800" 
                  : "bg-blue-600 text-white"
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4 mt-0.5 text-gray-600" />
                ) : (
                  <User className="h-4 w-4 mt-0.5 text-blue-200" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  {message.timestamp && (
                    <p className={`text-xs mt-1 ${
                      message.role === "assistant" ? "text-gray-500" : "text-blue-200"
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-gray-600" />
                <div className="flex items-center space-x-1">
                  <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">FinSage is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={sendMessage} className="flex space-x-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about AAPL, TSLA, portfolio risk..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
