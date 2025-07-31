import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Play, Square, Volume2 } from 'lucide-react';
import { speechRecognitionManager, isSpeechRecognitionSupported } from '../../utils/speechRecognition';
import { speakText } from '../../utils/speechUtils';

export const SpeechRecognitionTest: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi' | 'gujarati'>('english');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
    
    // Setup speech recognition callbacks
    speechRecognitionManager.setCallbacks({
      onResult: (text: string) => {
        setTranscript(text);
        setIsListening(false);
        setError(null);
      },
      onError: (error: string) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        setError(`Error: ${error}`);
      },
      onStart: () => {
        setIsListening(true);
        setError(null);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  }, []);

  const handleStartListening = () => {
    setTranscript('');
    setError(null);
    const success = speechRecognitionManager.startListening(selectedLanguage);
    if (!success) {
      setError('Failed to start speech recognition');
    }
  };

  const handleStopListening = () => {
    speechRecognitionManager.stopListening();
  };

  const handleSpeakTranscript = () => {
    if (transcript) {
      speakText(transcript, selectedLanguage);
    }
  };

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'hindi': return 'हिंदी (Hindi)';
      case 'gujarati': return 'ગુજરાતી (Gujarati)';
      default: return 'English';
    }
  };

  const samplePrompts = {
    english: [
      "Hello, how are you today?",
      "What is the weather like?",
      "Tell me a joke",
      "How do I learn programming?"
    ],
    hindi: [
      "नमस्ते, आप कैसे हैं?",
      "आज का मौसम कैसा है?",
      "मुझे एक चुटकुला सुनाओ",
      "मैं प्रोग्रामिंग कैसे सीख सकता हूं?"
    ],
    gujarati: [
      "નમસ્તે, તમે કેમ છો?",
      "આજનો હવામાન કેવો છે?",
      "મને એક ચુટકલો સંભળાવો",
      "હું પ્રોગ્રામિંગ કેવી રીતે શીખી શકું?"
    ]
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Speech Recognition Test</h2>
      
      {!isSupported && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-700">
            Speech recognition is not supported in this browser. 
            Try using Chrome, Edge, or Safari for better support.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Language for Speech Recognition
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as 'english' | 'hindi' | 'gujarati')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="english">English</option>
            <option value="hindi">हिंदी (Hindi)</option>
            <option value="gujarati">ગુજરાતી (Gujarati)</option>
          </select>
        </div>

        {/* Sample Prompts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sample Prompts for {getLanguageName(selectedLanguage)}
          </label>
          <div className="space-y-2">
            {samplePrompts[selectedLanguage].map((prompt, index) => (
              <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">{prompt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleStartListening}
            disabled={!isSupported || isListening}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Mic className="w-4 h-4 mr-2" />
            {isListening ? 'Listening...' : 'Start Listening'}
          </button>
          
          <button
            onClick={handleStopListening}
            disabled={!isListening}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <MicOff className="w-4 h-4 mr-2" />
            Stop
          </button>
          
          <button
            onClick={handleSpeakTranscript}
            disabled={!transcript}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Speak Back
          </button>
        </div>

        {/* Status Indicator */}
        {isListening && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 font-medium">
                Listening for {getLanguageName(selectedLanguage)} speech...
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Speak clearly into your microphone
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Transcript Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recognized Text
          </label>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px]">
            {transcript ? (
              <p className="text-gray-900">{transcript}</p>
            ) : (
              <p className="text-gray-500 italic">
                Click "Start Listening" and speak to see your text here...
              </p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">How to Use:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Select your preferred language from the dropdown</li>
            <li>Click "Start Listening" to begin speech recognition</li>
            <li>Speak clearly into your microphone</li>
            <li>Click "Stop" or wait for automatic stop</li>
            <li>Your spoken text will appear in the transcript area</li>
            <li>Use "Speak Back" to hear the text spoken back to you</li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Troubleshooting:</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Ensure your microphone is connected and working</li>
            <li>Grant microphone permissions when prompted</li>
            <li>Use Chrome, Edge, or Safari for best support</li>
            <li>Speak clearly and at a normal pace</li>
            <li>Check that your system language supports the selected language</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 