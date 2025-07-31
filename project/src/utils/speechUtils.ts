// Multilingual Speech Synthesis Utility

export interface SpeechConfig {
  lang: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const LANGUAGE_CONFIGS: Record<string, SpeechConfig> = {
  english: {
    lang: 'en-US',
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0
  },
  hindi: {
    lang: 'hi-IN',
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0
  },
  gujarati: {
    lang: 'gu-IN',
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0
  }
};

export const speakText = (text: string, language: 'english' | 'hindi' | 'gujarati'): void => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  // Stop any currently speaking
  speechSynthesis.cancel();

  const config = LANGUAGE_CONFIGS[language];
  const voices = speechSynthesis.getVoices();
  
  console.log(`Attempting to speak in ${language} with ${voices.length} available voices`);
  console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
  
  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = config.lang;
  utterance.rate = config.rate || 0.9;
  utterance.pitch = config.pitch || 1.0;
  utterance.volume = config.volume || 1.0;

  // Enhanced voice selection logic with better fallbacks
  let selectedVoice = null;
  let fallbackUsed = false;
  
  // 1. Try exact language match first
  selectedVoice = voices.find(voice => voice.lang === config.lang);
  
  // 2. Try language family match (e.g., hi-* for Hindi)
  if (!selectedVoice) {
    const langCode = config.lang.split('-')[0];
    selectedVoice = voices.find(voice => voice.lang.startsWith(langCode));
  }
  
  // 3. Try alternative language codes for Hindi
  if (!selectedVoice && language === 'hindi') {
    selectedVoice = voices.find(voice => 
      voice.lang.includes('hi') || 
      voice.lang.includes('in') ||
      voice.name.toLowerCase().includes('hindi') ||
      voice.name.toLowerCase().includes('india')
    );
  }
  
  // 4. Try alternative language codes for Gujarati
  if (!selectedVoice && language === 'gujarati') {
    selectedVoice = voices.find(voice => 
      voice.lang.includes('gu') || 
      voice.lang.includes('in') ||
      voice.name.toLowerCase().includes('gujarati') ||
      voice.name.toLowerCase().includes('india')
    );
  }
  
  // 5. Fallback to any Indian English voice
  if (!selectedVoice && (language === 'hindi' || language === 'gujarati')) {
    selectedVoice = voices.find(voice => 
      voice.lang.includes('en-IN') ||
      voice.name.toLowerCase().includes('india')
    );
    if (selectedVoice) {
      fallbackUsed = true;
      console.log(`Using Indian English fallback for ${language}`);
    }
  }
  
  // 6. Final fallback to any English voice
  if (!selectedVoice) {
    selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    if (selectedVoice) {
      fallbackUsed = true;
      console.log(`Using general English fallback for ${language}`);
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang}) for ${language}`);
    
    // For Hindi/Gujarati with English fallback, adjust settings for better pronunciation
    if (fallbackUsed && (language === 'hindi' || language === 'gujarati')) {
      utterance.rate = 0.7; // Slower for better pronunciation
      utterance.pitch = 1.1; // Slightly higher pitch
      console.log(`Adjusted speech settings for ${language} fallback`);
    }
  } else {
    console.warn(`No suitable voice found for ${language}, using default`);
  }

  // Add event listeners for debugging
  utterance.onstart = () => {
    console.log(`Started speaking in ${language}${fallbackUsed ? ' (with fallback)' : ''}`);
    // Show user feedback
    if (fallbackUsed && (language === 'hindi' || language === 'gujarati')) {
      console.log(`Note: Using English voice for ${language} text. Install language packs for better experience.`);
    }
  };
  utterance.onend = () => console.log(`Finished speaking in ${language}`);
  utterance.onerror = (event) => {
    console.error(`Speech error for ${language}:`, event);
    // Try fallback to English if there's an error
    if (language !== 'english') {
      console.log(`Attempting English fallback for ${language}`);
      const englishUtterance = new SpeechSynthesisUtterance(text);
      englishUtterance.lang = 'en-US';
      englishUtterance.rate = 0.8;
      const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) {
        englishUtterance.voice = englishVoice;
        speechSynthesis.speak(englishUtterance);
      }
    }
  };

  // Speak the text
  speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
};

export const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  return speechSynthesis.getVoices();
};

export const checkLanguageSupport = (language: 'english' | 'hindi' | 'gujarati'): {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  fallbackVoice?: SpeechSynthesisVoice;
} => {
  const voices = getAvailableVoices();
  let languageVoices: SpeechSynthesisVoice[] = [];
  let fallbackVoice: SpeechSynthesisVoice | undefined;

  switch (language) {
    case 'english':
      languageVoices = voices.filter(v => v.lang.startsWith('en'));
      break;
    case 'hindi':
      languageVoices = voices.filter(v => 
        v.lang.includes('hi') || 
        v.name.toLowerCase().includes('hindi') ||
        v.lang.includes('in')
      );
      fallbackVoice = voices.find(v => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india'));
      break;
    case 'gujarati':
      languageVoices = voices.filter(v => 
        v.lang.includes('gu') || 
        v.name.toLowerCase().includes('gujarati') ||
        v.lang.includes('in')
      );
      fallbackVoice = voices.find(v => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india'));
      break;
  }

  return {
    supported: languageVoices.length > 0,
    voices: languageVoices,
    fallbackVoice
  };
};

// Initialize voices when they become available
export const initializeVoices = (): void => {
  if (!('speechSynthesis' in window)) {
    return;
  }

  // Force voice loading in some browsers
  speechSynthesis.getVoices();

  // Some browsers need time to load voices
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', () => {
      const voices = speechSynthesis.getVoices();
      console.log('Voices loaded:', voices.length);
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      
      // Log specific language voices
      const hindiVoices = voices.filter(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
      const gujaratiVoices = voices.filter(v => v.lang.includes('gu') || v.name.toLowerCase().includes('gujarati'));
      const indianVoices = voices.filter(v => v.lang.includes('in') || v.name.toLowerCase().includes('india'));
      
      if (hindiVoices.length > 0) console.log('Hindi voices found:', hindiVoices.map(v => `${v.name} (${v.lang})`));
      if (gujaratiVoices.length > 0) console.log('Gujarati voices found:', gujaratiVoices.map(v => `${v.name} (${v.lang})`));
      if (indianVoices.length > 0) console.log('Indian voices found:', indianVoices.map(v => `${v.name} (${v.lang})`));
    });
  } else {
    // Voices already loaded
    const voices = speechSynthesis.getVoices();
    console.log('Voices already loaded:', voices.length);
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
  }
}; 