import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';
import { speakText, stopSpeaking, isSpeechSupported, getAvailableVoices, checkLanguageSupport } from '../../utils/speechUtils';

export const SpeechTest: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi' | 'gujarati'>('english');
  const [testText, setTestText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sampleTexts = {
    english: "Hello! Welcome to BharatGPT. I'm here to help you learn digital literacy.",
    hindi: "नमस्ते! भारतजीपीटी में आपका स्वागत है। मैं आपको डिजिटल साक्षरता सीखने में मदद करने के लिए यहाँ हूँ।",
    gujarati: "નમસ્તે! ભારતજીપીટીમાં તમારું સ્વાગત છે. હું તમને ડિજિટલ સાક્ષરતા શીખવામાં મદદ કરવા માટે અહીં છું."
  };

  const handleSpeak = () => {
    const textToSpeak = testText || sampleTexts[selectedLanguage];
    setIsSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speakText(textToSpeak, selectedLanguage);
  };

  const handleStop = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const voices = getAvailableVoices();
  const languageSupport = checkLanguageSupport(selectedLanguage);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Multilingual Speech Test</h2>
      
      {!isSpeechSupported() && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-700">Speech synthesis is not supported in this browser.</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Language
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

        {/* Available Voices */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Support for {selectedLanguage}
          </label>
          <div className="text-sm text-gray-600 space-y-2">
            <div className={`p-2 rounded-lg ${languageSupport.supported ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {languageSupport.supported ? '✅ Native voices available' : '⚠️ Using fallback voice'}
            </div>
            
            {languageSupport.voices.length > 0 && (
              <div>
                <strong>Native voices:</strong>
                {languageSupport.voices.map((voice, index) => (
                  <div key={index} className="ml-2">
                    • {voice.name} ({voice.lang})
                  </div>
                ))}
              </div>
            )}
            
            {languageSupport.fallbackVoice && !languageSupport.supported && (
              <div>
                <strong>Fallback voice:</strong>
                <div className="ml-2">
                  • {languageSupport.fallbackVoice.name} ({languageSupport.fallbackVoice.lang})
                </div>
              </div>
            )}
            
            {!languageSupport.supported && !languageSupport.fallbackVoice && (
              <div className="text-red-600">
                ❌ No suitable voices found for {selectedLanguage}
              </div>
            )}
          </div>
        </div>

        {/* Test Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Text (or use sample)
          </label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder={sampleTexts[selectedLanguage]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Sample Text Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sample Text
          </label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">{sampleTexts[selectedLanguage]}</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSpeak}
            disabled={!isSpeechSupported() || isSpeaking}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 mr-2" />
            {isSpeaking ? 'Speaking...' : 'Speak'}
          </button>
          
          <button
            onClick={handleStop}
            disabled={!isSpeaking}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </button>
          
          <button
            onClick={() => {
              const testText = selectedLanguage === 'hindi' ? 
                'नमस्ते! यह एक परीक्षण है।' : 
                selectedLanguage === 'gujarati' ? 
                'નમસ્તે! આ એક પરીક્ષણ છે.' : 
                'Hello! This is a test.';
              speakText(testText, selectedLanguage);
            }}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Quick Test
          </button>
        </div>

        {/* Debug Information */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Debug Information:</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <div><strong>Total voices available:</strong> {voices.length}</div>
            <div><strong>Browser:</strong> {navigator.userAgent}</div>
            <div><strong>Speech synthesis supported:</strong> {isSpeechSupported() ? 'Yes' : 'No'}</div>
            <div><strong>Current language:</strong> {selectedLanguage}</div>
            <div><strong>Language support:</strong> {languageSupport.supported ? 'Native' : 'Fallback'}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select your preferred language from the dropdown</li>
            <li>• Enter custom text or use the sample text provided</li>
            <li>• Click "Speak" to hear the text in the selected language</li>
            <li>• Use "Stop" to interrupt the speech</li>
            <li>• The system will automatically select the best available voice for each language</li>
            <li>• Check the debug information above to see available voices</li>
            <li>• Open browser console (F12) to see detailed voice selection logs</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Troubleshooting:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• If Hindi/Gujarati doesn't work, check if your browser has Indian language voices installed</li>
            <li>• Chrome/Edge usually have better voice support than Firefox</li>
            <li>• Some browsers require language packs to be installed separately</li>
            <li>• The system will fall back to English if no native voice is found</li>
            <li>• Check browser console for detailed voice selection information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 