import { SARVAM_API_BASE, SARVAM_API_KEY, LANGUAGES } from './constants';

export interface TranslationResult {
  languageCode: string;
  languageName: string;
  nativeName: string;
  translatedText: string;
  isLoading: boolean;
  error: string | null;
}

export async function translateText(
  input: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const res = await fetch(`${SARVAM_API_BASE}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': SARVAM_API_KEY,
    },
    body: JSON.stringify({
      input,
      source_language_code: sourceLanguage,
      target_language_code: targetLanguage,
      model: 'mayura:v1',
      mode: 'formal',
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `Translation failed (${res.status})`);
  }

  const data = await res.json();
  return data.translated_text;
}

export async function translateToAllLanguages(
  input: string,
  sourceLanguage: string
): Promise<TranslationResult[]> {
  const targets = LANGUAGES.filter((l) => l.code !== sourceLanguage);

  const results = await Promise.allSettled(
    targets.map(async (lang) => {
      const text = await translateText(input, sourceLanguage, lang.code);
      return {
        languageCode: lang.code,
        languageName: lang.name,
        nativeName: lang.nativeName,
        translatedText: text,
        isLoading: false,
        error: null,
      } satisfies TranslationResult;
    })
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      languageCode: targets[i].code,
      languageName: targets[i].name,
      nativeName: targets[i].nativeName,
      translatedText: '',
      isLoading: false,
      error: r.reason?.message || 'Translation failed',
    };
  });
}
