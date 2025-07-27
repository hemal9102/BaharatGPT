import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, User, Bot, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Message, LearningModule } from '../../types';

export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello, I want to learn HTML.",
      isUser: true,
      timestamp: new Date()
    },
    {
      id: 2,
      text: "Great! Let's get started with HTML basics. HTML stands for HyperText Markup Language and is the foundation of web development. Would you like to start with basic HTML structure or specific elements?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModule, setCurrentModule] = useState<LearningModule | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
      module_id: currentModule?.id
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send to N8N webhook with enhanced context
      const response = await fetch('https://abbe90c95b33.ngrok-free.app/webhook-test/4a7b0437-a005-48da-9c6c-6f29b8ca8842', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          user_id: user?.id,
          module_id: currentModule?.id,
          context: {
            previous_messages: messages.slice(-5),
            user_level: 'beginner',
            language_preference: 'en'
          }
        })
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: data.response || data.message || "I'm here to help you learn! Could you please rephrase your question?",
        isUser: false,
        timestamp: new Date(),
        understanding_feedback: data.understanding_level || 3
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save chat interaction to database
      if (user) {
        await supabase.from('chat_interactions').insert({
          user_id: user.id,
          module_id: currentModule?.id,
          user_message: userMessage.text,
          ai_response: aiMessage.text,
          understanding_level: data.understanding_level || 3
        });
      }

      // Text-to-speech for audio support
      if (audioEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiMessage.text);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      console.error('Webhook error:', error);
      
      const fallbackMessage: Message = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now, but I'm here to help you learn! What subject would you like to explore today?",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const provideFeedback = async (messageId: number, feedback: 'helpful' | 'not_helpful') => {
    if (user) {
      await supabase.from('message_feedback').insert({
        user_id: user.id,
        message_id: messageId,
        feedback_type: feedback
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  BharatGPT – AI Chat for Students
                </h1>
                {currentModule && (
                  <p className="text-sm text-gray-600">Learning: {currentModule.title}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <select className="text-sm border border-gray-300 rounded-lg px-2 py-1">
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Section */}
      <main className="flex-1 pt-16 pb-20 overflow-hidden">
        <div 
          ref={chatContainerRef}
          className="h-full overflow-y-auto px-4 py-4 max-w-4xl mx-auto"
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-xs sm:max-w-md md:max-w-lg ${message.isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.isUser ? 'bg-blue-500' : 'bg-gray-400'}`}>
                    {message.isUser ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.isUser
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      
                      {/* Understanding Level Indicator */}
                      {!message.isUser && message.understanding_feedback && (
                        <div className="mt-2 flex items-center space-x-1">
                          <span className="text-xs text-gray-500">Understanding:</span>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`w-2 h-2 rounded-full ${
                                level <= message.understanding_feedback! 
                                  ? 'bg-green-400' 
                                  : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Feedback Buttons for AI Messages */}
                    {!message.isUser && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => provideFeedback(message.id, 'helpful')}
                          className="text-xs text-gray-500 hover:text-green-600 transition-colors"
                        >
                          👍 Helpful
                        </button>
                        <button
                          onClick={() => provideFeedback(message.id, 'not_helpful')}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                          👎 Not helpful
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-xs">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Enhanced Input Section */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about your studies..."
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            BharatGPT can make mistakes. Verify important information.
          </div>
        </div>
      </footer>
    </div>
  );
};