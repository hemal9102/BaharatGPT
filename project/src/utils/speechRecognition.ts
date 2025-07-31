// Multilingual Speech Recognition Utility

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export const LANGUAGE_RECOGNITION_CONFIGS: Record<string, SpeechRecognitionConfig> = {
  english: {
    lang: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1
  },
  hindi: {
    lang: 'hi-IN',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1
  },
  gujarati: {
    lang: 'gu-IN',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1
  }
};

export class SpeechRecognitionManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResult: ((text: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onStart: (() => void) | null = null;
  private onEnd: (() => void) | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // If we have final results, send them
      if (finalTranscript.trim()) {
        console.log('Final transcript:', finalTranscript);
        if (this.onResult) {
          this.onResult(finalTranscript.trim());
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      // Handle specific errors
      if (event.error === 'no-speech') {
        // Restart listening for no-speech errors in continuous mode
        setTimeout(() => {
          if (this.isListening) {
            this.recognition.start();
          }
        }, 100);
      } else if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
      if (this.onStart) {
        this.onStart();
      }
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // If we're supposed to be listening but recognition ended, restart it
      if (this.isListening) {
        console.log('Restarting speech recognition...');
        setTimeout(() => {
          if (this.isListening) {
            this.recognition.start();
          }
        }, 100);
      } else {
        if (this.onEnd) {
          this.onEnd();
        }
      }
    };
  }

  public startListening(language: 'english' | 'hindi' | 'gujarati'): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    const config = LANGUAGE_RECOGNITION_CONFIGS[language];
    
    try {
      this.recognition.lang = config.lang;
      this.recognition.continuous = config.continuous;
      this.recognition.interimResults = config.interimResults;
      this.recognition.maxAlternatives = config.maxAlternatives;
      
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public getListeningStatus(): boolean {
    return this.isListening;
  }

  public setCallbacks(callbacks: {
    onResult?: (text: string) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }) {
    this.onResult = callbacks.onResult || null;
    this.onError = callbacks.onError || null;
    this.onStart = callbacks.onStart || null;
    this.onEnd = callbacks.onEnd || null;
  }

  public getAvailableLanguages(): string[] {
    const languages = ['english'];
    
    // Check if Hindi and Gujarati are supported
    // Note: Support varies by browser and system
    if (this.isSupported()) {
      languages.push('hindi', 'gujarati');
    }
    
    return languages;
  }
}

// Global instance
export const speechRecognitionManager = new SpeechRecognitionManager();

// Helper functions
export const isSpeechRecognitionSupported = (): boolean => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const getSupportedLanguages = (): string[] => {
  return speechRecognitionManager.getAvailableLanguages();
}; 