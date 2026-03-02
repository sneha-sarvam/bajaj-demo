export const SARVAM_API_KEY = process.env.NEXT_PUBLIC_SARVAM_API_KEY || 'sk_gcz3ecmo_o0gyEPotdxmxv00hQIKedgaX';
export const SARVAM_API_BASE = 'https://api.sarvam.ai';
export const SARVAM_WS_URL = 'wss://api.sarvam.ai/speech-to-text/ws';

export const TARGET_SAMPLE_RATE = 16000;
export const CHUNK_DURATION = 0.5; // 500ms

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const LANGUAGES: Language[] = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'od-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'en-IN', name: 'English', nativeName: 'English' },
];
