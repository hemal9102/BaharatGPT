# Voice Installation Guide for Multilingual Speech

This guide helps you install language voices for better speech synthesis support in BharatGPT.

## Why Install Language Voices?

While BharatGPT can work with basic speech synthesis, installing native language voices will provide:
- Better pronunciation for Hindi and Gujarati
- More natural-sounding speech
- Improved learning experience
- Better accent and intonation

## Browser-Specific Instructions

### Google Chrome

1. **Open Chrome Settings**
   - Click the three dots menu → Settings
   - Or type `chrome://settings/` in the address bar

2. **Access Language Settings**
   - Scroll down to "Advanced" section
   - Click "Languages"

3. **Add Indian Languages**
   - Click "Add languages"
   - Search for and add:
     - Hindi (India)
     - Gujarati (India)
   - Click "Add"

4. **Download Language Packs**
   - For each added language, click the three dots
   - Select "Download" to install the language pack
   - This includes speech synthesis voices

5. **Restart Chrome**
   - Close and reopen Chrome for changes to take effect

### Microsoft Edge

1. **Open Edge Settings**
   - Click the three dots menu → Settings
   - Or type `edge://settings/` in the address bar

2. **Access Language Settings**
   - Go to "Languages" section
   - Click "Add languages"

3. **Add Indian Languages**
   - Search for and add:
     - Hindi (India)
     - Gujarati (India)
   - Click "Add"

4. **Download Language Packs**
   - For each language, click "Download"
   - This installs speech synthesis voices

5. **Restart Edge**
   - Close and reopen Edge

### Mozilla Firefox

**Note**: Firefox has limited support for Indian language voices. Consider using Chrome or Edge for better voice support.

1. **Open Firefox Settings**
   - Click the hamburger menu → Settings
   - Or type `about:preferences` in the address bar

2. **Access Language Settings**
   - Go to "Language and Appearance"
   - Click "Choose" under "Languages"

3. **Add Languages**
   - Click "Add languages"
   - Add Hindi and Gujarati
   - Move them to the top of the list

4. **Install Language Packs**
   - Firefox may prompt to install language packs
   - Follow the prompts to download

## Windows System Voices

### Install Windows Language Packs

1. **Open Windows Settings**
   - Press `Windows + I`
   - Go to "Time & Language" → "Language"

2. **Add Languages**
   - Click "Add a language"
   - Search for and add:
     - Hindi (India)
     - Gujarati (India)

3. **Download Language Features**
   - For each language, click "Options"
   - Download "Speech recognition" and "Text-to-speech"
   - This installs system voices

4. **Restart Applications**
   - Restart your browser after installation

### Verify Installation

1. **Test in BharatGPT**
   - Go to `/speech-test` in BharatGPT
   - Check if Hindi/Gujarati voices are available
   - Look for green checkmarks indicating native voice support

2. **Check Browser Console**
   - Press F12 to open developer tools
   - Look for voice availability logs
   - Should see Hindi/Gujarati voices listed

## macOS System Voices

### Install Additional Voices

1. **Open System Preferences**
   - Go to "System Preferences" → "Accessibility"

2. **Access Speech Settings**
   - Click "Speech" tab
   - Click "System Voice" dropdown

3. **Customize Voices**
   - Click "Customize..."
   - Look for Hindi and Gujarati voices
   - Download if available

4. **Alternative Method**
   - Open "TextEdit"
   - Go to "Edit" → "Speech" → "Start Speaking"
   - This may prompt to download additional voices

## Linux System Voices

### Install Festival or eSpeak

```bash
# Ubuntu/Debian
sudo apt-get install festival festvox-kallpc16k

# For Hindi support
sudo apt-get install festvox-hi-nsk

# For Gujarati (limited support)
sudo apt-get install espeak-data
```

### Install Additional Language Packs

```bash
# Install Indian language support
sudo apt-get install language-pack-hi language-pack-gu

# Install speech synthesis
sudo apt-get install speech-dispatcher
```

## Mobile Browsers

### iOS Safari
- Limited support for Indian languages
- Uses system voices if available
- Consider using Chrome or Edge on mobile

### Android Chrome
- Better support for Indian languages
- May require Google Text-to-speech updates
- Check Play Store for language pack updates

## Troubleshooting

### No Voices Available
1. **Check Browser Console**
   - Press F12 and look for voice logs
   - Check if voices are being detected

2. **Restart Browser**
   - Close all browser windows
   - Reopen and try again

3. **Clear Browser Cache**
   - Clear browsing data
   - Restart browser

4. **Try Different Browser**
   - Chrome/Edge have better voice support
   - Firefox has limited Indian language support

### Poor Voice Quality
1. **Check Voice Settings**
   - Use the speech test page to verify
   - Try different voice options

2. **Update System**
   - Keep your operating system updated
   - Update browser to latest version

3. **Install Language Packs**
   - Follow the installation guides above
   - Ensure language packs are fully downloaded

### Fallback to English
If Hindi/Gujarati voices are not available:
1. The system will automatically fall back to English
2. You'll see a warning in the speech test
3. Consider installing language packs as described above

## Testing Your Installation

1. **Visit Speech Test Page**
   - Go to `/speech-test` in BharatGPT
   - Select Hindi or Gujarati
   - Check if native voices are available

2. **Test in Chat**
   - Enable audio in the chat interface
   - Send a message in Hindi or Gujarati
   - Listen to the AI response

3. **Check Console Logs**
   - Open browser console (F12)
   - Look for voice selection messages
   - Verify correct voices are being used

## Support

If you continue to have issues:
1. Check the debug information in the speech test page
2. Verify your browser and system are up to date
3. Try a different browser (Chrome/Edge recommended)
4. Ensure language packs are properly installed
5. Check that your system supports the languages

## Alternative Solutions

If native voices are not available:
1. **Use English with Indian Accent**: The system will try to use Indian English voices
2. **Browser Extensions**: Some browsers support voice extension plugins
3. **System Text-to-Speech**: Use your operating system's built-in speech features
4. **Online TTS Services**: Consider using online text-to-speech services for better quality 