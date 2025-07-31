# Multilingual Speech Synthesis Feature

This document describes the multilingual speech synthesis feature implemented in BharatGPT, which supports English, Hindi, and Gujarati languages.

## Overview

The speech synthesis feature allows users to hear AI responses spoken aloud in their preferred language. The system automatically detects the selected language and uses appropriate speech synthesis settings for optimal pronunciation.

## Supported Languages

1. **English (en-US)**
   - Language code: `en-US`
   - Rate: 0.9 (slightly slower for clarity)
   - Pitch: 1.0 (normal)
   - Volume: 1.0 (full volume)

2. **Hindi (hi-IN)**
   - Language code: `hi-IN`
   - Rate: 0.8 (slower for better pronunciation)
   - Pitch: 1.0 (normal)
   - Volume: 1.0 (full volume)

3. **Gujarati (gu-IN)**
   - Language code: `gu-IN`
   - Rate: 0.8 (slower for better pronunciation)
   - Pitch: 1.0 (normal)
   - Volume: 1.0 (full volume)

## Implementation Details

### Core Files

1. **`src/utils/speechUtils.ts`** - Main speech synthesis utility
2. **`src/components/Chat/ChatInterface.tsx`** - Updated chat interface with speech support
3. **`src/components/Chat/SpeechTest.tsx`** - Test component for speech functionality

### Key Functions

#### `speakText(text: string, language: 'english' | 'hindi' | 'gujarati')`
- Converts text to speech in the specified language
- Automatically selects the best available voice
- Handles language-specific settings

#### `stopSpeaking()`
- Stops any currently playing speech
- Useful for interrupting long responses

#### `isSpeechSupported()`
- Checks if the browser supports speech synthesis
- Returns boolean indicating support

#### `getAvailableVoices()`
- Returns list of available speech synthesis voices
- Useful for debugging and voice selection

#### `initializeVoices()`
- Initializes speech synthesis voices
- Handles browser-specific voice loading delays

## Usage in Chat Interface

### Language Selection
Users can select their preferred language from the dropdown:
- English
- हिंदी (Hindi)
- ગુજરાતી (Gujarati)

### Audio Toggle
- Click the volume icon to enable/disable speech
- When enabled, AI responses are automatically spoken
- Visual indicator shows which language is being spoken

### Automatic Speech
When audio is enabled:
1. User sends a message
2. AI responds in the selected language
3. Response is automatically spoken using appropriate voice
4. Visual indicator shows speech language

## Browser Compatibility

### Supported Browsers
- Chrome/Chromium (best support)
- Firefox
- Safari
- Edge

### Voice Availability
- **English**: Widely available across all browsers
- **Hindi**: Available in most modern browsers
- **Gujarati**: Limited availability, may fall back to English

### Fallback Behavior
If a specific language voice is not available:
1. System tries to find any voice for the language family
2. Falls back to English voice if no suitable voice found
3. Logs warning to console for debugging

## Testing

### Speech Test Component
Access the speech test at `/speech-test` to:
- Test speech synthesis for each language
- View available voices
- Test custom text input
- Verify language-specific settings

### Sample Texts
Each language includes sample texts for testing:

**English:**
```
Hello! Welcome to BharatGPT. I'm here to help you learn digital literacy.
```

**Hindi:**
```
नमस्ते! भारतजीपीटी में आपका स्वागत है। मैं आपको डिजिटल साक्षरता सीखने में मदद करने के लिए यहाँ हूँ।
```

**Gujarati:**
```
નમસ્તે! ભારતજીપીટીમાં તમારું સ્વાગત છે. હું તમને ડિજિટલ સાક્ષરતા શીખવામાં મદદ કરવા માટે અહીં છું.
```

## Configuration

### Language Settings
Language-specific settings can be modified in `LANGUAGE_CONFIGS`:

```typescript
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
```

### Voice Selection
The system automatically selects the best available voice:
1. Exact language match (e.g., `hi-IN`)
2. Language family match (e.g., `hi-*`)
3. Fallback to English if no suitable voice

## Troubleshooting

### Common Issues

1. **No Speech Heard**
   - Check if audio is enabled (volume icon)
   - Verify browser supports speech synthesis
   - Check browser permissions for audio

2. **Wrong Language Voice**
   - Browser may not have voice for selected language
   - Check available voices in speech test
   - System will fall back to English

3. **Speech Interrupted**
   - Click stop button to interrupt
   - Change language to stop current speech
   - Navigate away from chat to stop

4. **Poor Pronunciation**
   - Some languages may have limited voice quality
   - Try adjusting rate/pitch in configuration
   - Consider using English for better clarity

### Debug Information
Check browser console for:
- Available voices list
- Voice selection decisions
- Speech synthesis errors
- Language fallback warnings

## Future Enhancements

### Planned Features
1. **Voice Selection**: Allow users to choose specific voices
2. **Speed Control**: Adjustable speech rate
3. **Pitch Control**: Adjustable voice pitch
4. **Volume Control**: Adjustable speech volume
5. **Offline Support**: Pre-downloaded voice packages

### Additional Languages
Potential languages to add:
- Bengali (bn-IN)
- Tamil (ta-IN)
- Telugu (te-IN)
- Marathi (mr-IN)
- Punjabi (pa-IN)

## Security Considerations

1. **Text Sanitization**: All text is sanitized before speech synthesis
2. **No Audio Recording**: System only speaks, doesn't record
3. **Browser Permissions**: Uses standard browser speech synthesis APIs
4. **Privacy**: No audio data is stored or transmitted

## Performance Notes

1. **Voice Loading**: Voices may take time to load on first use
2. **Memory Usage**: Speech synthesis uses minimal memory
3. **Network**: No network requests for speech synthesis
4. **Battery**: Speech synthesis may impact battery life on mobile devices 