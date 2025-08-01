import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, User, Bot, Volume2, VolumeX, Globe, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Message, LearningModule } from '../../types';
import { speakText, stopSpeaking, initializeVoices, isSpeechSupported, checkLanguageSupport } from '../../utils/speechUtils';
import { VoiceNotification } from './VoiceNotification';
import { speechRecognitionManager, isSpeechRecognitionSupported } from '../../utils/speechRecognition';

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
        setIsListening(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Add user message to chat immediately
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: inputMessage,
        isUser: true,
        timestamp: new Date()
      }
    ]);
    setInputMessage(""); // Clear input immediately after sending

    // Process user input and generate a response
    let response = await fetchResponseFromBackend(inputMessage);
    response = response.replace(/\*/g, ""); // Remove all asterisks
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        timestamp: new Date()
      }
    ]);
  };

  const fetchResponseFromBackend = async (message: string) => {
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
          message: message,
          user_id: user?.id,
          chatInput: message,
          body: { body: { message: message } },
          context: {
            previous_messages: messages.slice(-5),
            user_level: 'beginner',
            language_preference: selectedLanguage
          }
        })
      });

      let rawData;
      try {
        rawData = await response.json();
      } catch (jsonError) {
        console.error('Webhook error: Invalid JSON response', jsonError);
        return "I'm having trouble connecting right now, but I'm here to help you learn digital literacy! What would you like to learn today?";
      }
      // N8N might return an array with one object, or just the object.
      const data = Array.isArray(rawData) ? rawData[0] : rawData;
      let aiResponseText = '';
      if (data.response && data.response.languages) {
        const multilingualData = data.response as MultilingualResponse;
        aiResponseText = multilingualData.languages[selectedLanguage] || 
                        multilingualData.languages.english || 
                        "I'm here to help you learn!";
      } else {
        aiResponseText = data.response || data.message || "I'm here to help you learn! Could you please rephrase your question?";
      }
      
      // Save chat interaction to database with multilingual support
      if (user) {
        const { error: supabaseError } = await supabase.from('chat_interactions').insert({
          user_id: user.id,
          module_id: currentModule?.id,
          user_message: message,
          ai_response: aiResponseText,
          understanding_level: data.understanding_level || 3,
          language_used: selectedLanguage
        });
        if (supabaseError) {
          console.error('Supabase chat_interactions insert error:', supabaseError);
        }
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
        
        speakText(aiResponseText, selectedLanguage);
      }
      
      return aiResponseText;
    } catch (error) {
      console.error('Webhook error:', error);
      return "I'm having trouble connecting right now, but I'm here to help you learn digital literacy! What would you like to learn today?";
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
    } else {
      const success = speechRecognitionManager.startListening(selectedLanguage);
      if (!success) {
        console.error('Failed to start speech recognition');
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
        <div 
          ref={chatContainerRef}
          className="h-full overflow-y-auto px-4 py-4 max-w-4xl mx-auto"
        >
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={message.id ? message.id : idx}
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
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: message.text.replace(/<br>/g, '<br />') }}
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
                              key={`understanding-${message.id}-${level}`}
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
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
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
              <div className="mt-1 text-red-500 font-medium animate-pulse">
                🎤 Listening... Speak now!
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};