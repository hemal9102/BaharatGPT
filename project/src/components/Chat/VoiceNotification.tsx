import React, { useState, useEffect } from 'react';
import { Volume2, X, Info } from 'lucide-react';

interface VoiceNotificationProps {
  language: 'english' | 'hindi' | 'gujarati';
  showNotification: boolean;
  onClose: () => void;
}

export const VoiceNotification: React.FC<VoiceNotificationProps> = ({
  language,
  showNotification,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showNotification) {
      setIsVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification, onClose]);

  if (!isVisible) return null;

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'hindi': return 'हिंदी';
      case 'gujarati': return 'ગુજરાતી';
      default: return 'English';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Voice Information
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Using English voice for {getLanguageName(language)} text. 
              Install language packs for better pronunciation.
            </p>
            <div className="mt-2 space-y-1">
              <a 
                href="/speech-test" 
                className="text-xs text-blue-600 hover:text-blue-800 underline block"
              >
                Learn how to install language voices →
              </a>
              <a 
                href="/speech-recognition-test" 
                className="text-xs text-blue-600 hover:text-blue-800 underline block"
              >
                Test speech recognition →
              </a>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}; 