import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, User, Bot, Volume2, VolumeX, Globe, Mic, MicOff, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Message, LearningModule } from '../../types';
import { speakText, stopSpeaking, initializeVoices, isSpeechSupported, checkLanguageSupport } from '../../utils/speechUtils';
import { VoiceNotification } from './VoiceNotification';
import { speechRecognitionManager, isSpeechRecognitionSupported } from '../../utils/speechRecognition';
import { getUserLearningHistory } from '../../lib/quizService';

interface MultilingualResponse {
  type: string;
  languages: {
    english: string;
    hindi: string;
    gujarati: string;
  };
  meta: {
    responseId: string;
    timestamp: string;
  };
}

export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello, I want to learn digital literacy and coding.",
      isUser: true,
      timestamp: new Date()
    },
    {
      id: 2,
      text: "Great! Let's start with digital literacy basics. I'll teach you step by step in multiple languages to help you understand better.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModule, setCurrentModule] = useState<LearningModule | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi' | 'gujarati'>('english');
  const [showVoiceNotification, setShowVoiceNotification] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [learningHistory, setLearningHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize speech synthesis voices and check speech recognition support
  useEffect(() => {
    initializeVoices();
    setSpeechSupported(isSpeechRecognitionSupported());
    
    // Setup speech recognition callbacks
    speechRecognitionManager.setCallbacks({
      onResult: (text: string) => {
        setInputMessage(text);
        // Don't stop listening - keep it continuous
        // Only stop if user manually stops or submits
      },
      onError: (error: string) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      },
      onStart: () => {
        setIsListening(true);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
    
    // Cleanup: stop speech when component unmounts
    return () => {
      stopSpeaking();
      speechRecognitionManager.stopListening();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user's learning history
  const fetchLearningHistory = async () => {
    try {
      const { data } = await getUserLearningHistory();
      if (data) {
        setLearningHistory(data);
      }
    } catch (error) {
      console.error('Error fetching learning history:', error);
    }
  };

  // Load learning history when component mounts
  useEffect(() => {
    if (user) {
      fetchLearningHistory();
    }
  }, [user]);

  // Format message text to clean up markdown and formatting
  const formatMessageText = (text: string): string => {
    return text
      // Convert markdown bold to HTML
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert markdown italic to HTML
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert line breaks to proper HTML
      .replace(/\n/g, '<br />')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Add proper spacing around code blocks
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Clean up any remaining asterisks that aren't part of formatting
      .replace(/(?<!\*)\*(?!\*)/g, '')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Stop listening when submitting
    if (isListening) {
      speechRecognitionManager.stopListening();
    }

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
      // Send to your N8N multilingual workflow
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://e033a98c0626.ngrok-free.app/webhook/67a85760-2dd7-474a-bd42-cb2d6b17e7cc';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          message: userMessage.text,
          user_id: user?.id,
          chatInput: userMessage.text,
          body: { body: { message: userMessage.text } },
          context: {
            previous_messages: messages.slice(-5),
            user_level: 'beginner',
            language_preference: selectedLanguage
          }
        })
      });

      const rawData = await response.json();
            // N8N might return an array with one object, or just the object.
      const data = Array.isArray(rawData) ? rawData[0] : rawData; // Extract the first object if it's an array
      
      // Handle multilingual response
      let aiResponseText = '';
      if (data.response && data.response.languages) {
        const multilingualData = data.response as MultilingualResponse;
        aiResponseText = multilingualData.languages[selectedLanguage] || 
                        multilingualData.languages.english || 
                        "I'm here to help you learn!";
      } else {
        aiResponseText = data.response || data.message || "I'm here to help you learn! Could you please rephrase your question?";
      }
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
        understanding_feedback: data.understanding_level || 3
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save chat interaction to learning_history table with multilingual support
      if (user) {
        try {
          // Get current authenticated user
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (currentUser) {
            // Save user message to learning history
            await supabase.from('learning_history').insert({
              user_id: currentUser.id,
              type: 'chat_user_message',
              english: selectedLanguage === 'english' ? userMessage.text : '',
              hindi: selectedLanguage === 'hindi' ? userMessage.text : '',
              gujarati: selectedLanguage === 'gujarati' ? userMessage.text : '',
              content: userMessage.text,
              timestamp: new Date().toISOString()
            });

            // Save AI response to learning history
            await supabase.from('learning_history').insert({
              user_id: currentUser.id,
              type: 'chat_ai_response',
              english: selectedLanguage === 'english' ? aiMessage.text : '',
              hindi: selectedLanguage === 'hindi' ? aiMessage.text : '',
              gujarati: selectedLanguage === 'gujarati' ? aiMessage.text : '',
              content: aiMessage.text,
              understanding_level: data.understanding_level || 3,
              language_used: selectedLanguage,
              timestamp: new Date().toISOString()
            });

            // Also save to chat_interactions table for backward compatibility
            await supabase.from('chat_interactions').insert({
              user_id: currentUser.id,
              module_id: currentModule?.id,
              user_message: userMessage.text,
              ai_response: aiMessage.text,
              understanding_level: data.understanding_level || 3,
              language_used: selectedLanguage
            });
          }
        } catch (error) {
          console.error('Error saving to learning history:', error);
        }
        
        // Refresh learning history after saving
        await fetchLearningHistory();
      }

      // Restart listening if it was active before
      if (speechSupported && !isListening) {
        // Small delay to ensure the AI response is processed
        setTimeout(() => {
          speechRecognitionManager.startListening(selectedLanguage);
        }, 1000);
      }

      // Text-to-speech for audio support with multilingual support
      if (audioEnabled && isSpeechSupported()) {
        // Check if we have native voice support for the selected language
        const languageSupport = checkLanguageSupport(selectedLanguage);
        
        if (!languageSupport.supported && (selectedLanguage === 'hindi' || selectedLanguage === 'gujarati')) {
          // Show notification that fallback is being used
          setShowVoiceNotification(true);
          console.log(`Using fallback voice for ${selectedLanguage}. Install language packs for better experience.`);
        }
        
        speakText(aiMessage.text, selectedLanguage);
      }
      
    } catch (error) {
      console.error('Webhook error:', error);
      
      const fallbackMessage: Message = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now, but I'm here to help you learn digital literacy! What would you like to learn today?",
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

  const handleLanguageChange = (newLanguage: 'english' | 'hindi' | 'gujarati') => {
    // Stop any current speech when changing language
    if (audioEnabled) {
      stopSpeaking();
    }
    setSelectedLanguage(newLanguage);
  };

  const handleMicrophoneToggle = () => {
    if (isListening) {
      speechRecognitionManager.stopListening();
      setIsListening(false);
    } else {
      const success = speechRecognitionManager.startListening(selectedLanguage);
      if (!success) {
        console.error('Failed to start speech recognition');
        setIsListening(false);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <VoiceNotification
        language={selectedLanguage}
        showNotification={showVoiceNotification}
        onClose={() => setShowVoiceNotification(false)}
      />
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  BharatGPT – AI Chat Session
                </h1>
                {currentModule && (
                  <p className="text-sm text-gray-600">Learning: {currentModule.title}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-600" />
                <select 
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as 'english' | 'hindi' | 'gujarati')}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
                >
                  <option value="english">English</option>
                  <option value="hindi">हिंदी</option>
                  <option value="gujarati">ગુજરાતી</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${
                  showHistory ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
                title="View learning history"
              >
                <History className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  if (audioEnabled) {
                    stopSpeaking();
                  }
                  setAudioEnabled(!audioEnabled);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
                title={audioEnabled ? 'Disable speech' : 'Enable speech'}
              >
                {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Section */}
      <main className="flex-1 pt-16 pb-20 overflow-hidden">
        <div className="flex h-full">
          {/* Learning History Sidebar */}
          {showHistory && (
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Learning History</h3>
                <p className="text-sm text-gray-600">Your recent learning activities</p>
              </div>
              <div className="p-4 space-y-3">
                {learningHistory.length > 0 ? (
                  learningHistory.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {item.type || item.activity_type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900">
                        {item.content || item.topic || 'Learning activity'}
                      </div>
                      {item.language_used && (
                        <div className="text-xs text-blue-600 mt-1">
                          Language: {item.language_used}
                        </div>
                      )}
                      {item.understanding_level && (
                        <div className="text-xs text-green-600 mt-1">
                          Understanding: {item.understanding_level}/5
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No learning history yet</p>
                    <p className="text-sm">Start chatting to build your history</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className={`h-full overflow-y-auto px-4 py-4 ${showHistory ? 'flex-1' : 'max-w-4xl mx-auto w-full'}`}
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
                      <div 
                        className="text-sm leading-relaxed max-w-none chat-message"
                        style={{
                          lineHeight: '1.6',
                          wordBreak: 'break-word'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: formatMessageText(message.text)
                        }}
                      />
                      
                      {/* Speech indicator for AI messages */}
                      {!message.isUser && audioEnabled && (
                        <div className="mt-2 flex items-center space-x-2">
                          <Volume2 className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-gray-500">
                            Speech: {selectedLanguage === 'english' ? 'English' : 
                                    selectedLanguage === 'hindi' ? 'हिंदी' : 'ગુજરાતી'}
                          </span>
                        </div>
                      )}
                      
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
                placeholder={`Ask me anything in ${selectedLanguage === 'english' ? 'English' : selectedLanguage === 'hindi' ? 'हिंदी' : 'ગુજરાતી'}...`}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>
            
            {/* Microphone Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={handleMicrophoneToggle}
                disabled={isLoading}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                title={isListening ? 'Stop listening' : `Speak in ${selectedLanguage}`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            AI Chat Session - Ask me anything in your preferred language!
            {isListening && (
              <div className="mt-1 text-red-500 font-medium animate-pulse flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>🎤 Listening continuously... Speak now!</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};