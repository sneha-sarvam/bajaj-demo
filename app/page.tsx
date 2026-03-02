'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeStt } from '@/hooks/useRealtimeStt';
import { translateToAllLanguages, TranslationResult } from '@/lib/translate';
import { LANGUAGES } from '@/lib/constants';

// ─── Icons ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WaveformBar({ level, index, total, isMobile }: { level: number; index: number; total: number; isMobile: boolean }) {
  const normalized = Math.max(0.08, Math.min(1, level));
  const isRecent = index >= total - 3;
  return (
    <div
      className="w-[2px] rounded-full transition-all duration-75"
      style={{
        height: `${Math.max(3, normalized * (isMobile ? 24 : 36))}px`,
        backgroundColor: isRecent ? '#4c6ef5' : '#9ca3af',
        opacity: isRecent ? 1 : 0.5 + (index / total) * 0.5,
      }}
    />
  );
}

// ─── Translation batch: one chunk = one batch of translations ───────────────

interface TranslationBatch {
  id: number;
  sourceText: string;
  translations: TranslationResult[];
  isTranslating: boolean;
}

function BatchCard({ batch, isFading }: { batch: TranslationBatch; isFading: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isFading ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* Source text label */}
      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 bg-gray-100 rounded-lg max-w-xl">
          <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{batch.sourceText}&rdquo;</p>
        </div>
        {batch.isTranslating && <SpinnerIcon className="w-3.5 h-3.5 text-[#4c6ef5] shrink-0" />}
      </div>

      {/* Language grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {batch.translations.map((result) => (
          <LanguageCell key={result.languageCode} result={result} />
        ))}
      </div>
    </motion.div>
  );
}

function LanguageCell({ result }: { result: TranslationResult }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:border-[#bac8ff] transition-all duration-200">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-800">{result.languageName}</span>
          <span className="text-[10px] text-gray-400">{result.nativeName}</span>
        </div>
        {result.translatedText && !result.isLoading && (
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-100"
          >
            {copied ? <CheckIcon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3 text-gray-400" />}
          </button>
        )}
      </div>

      {result.isLoading ? (
        <div className="space-y-1.5 py-0.5">
          <div className="h-3.5 bg-gray-100 rounded animate-pulse w-full" />
          <div className="h-3.5 bg-gray-100 rounded animate-pulse w-2/3" />
        </div>
      ) : result.error ? (
        <p className="text-xs text-red-400">{result.error}</p>
      ) : (
        <p className="text-sm leading-relaxed text-gray-700">{result.translatedText}</p>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

const MAX_VISIBLE_BATCHES = 2;

export default function Home() {
  const {
    isRecording,
    transcriptLines,
    error: sttError,
    recordingTime,
    audioLevels,
    detectedLanguage,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useRealtimeStt();

  const [batches, setBatches] = useState<TranslationBatch[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const batchIdRef = useRef(0);
  const processedCountRef = useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const translateChunk = useCallback(async (chunkText: string, batchId: number) => {
    const sourceLang = detectedLanguage || 'hi-IN';
    const targets = LANGUAGES.filter((l) => l.code !== sourceLang);

    // Create placeholder batch
    const placeholderBatch: TranslationBatch = {
      id: batchId,
      sourceText: chunkText,
      isTranslating: true,
      translations: targets.map((l) => ({
        languageCode: l.code,
        languageName: l.name,
        nativeName: l.nativeName,
        translatedText: '',
        isLoading: true,
        error: null,
      })),
    };

    setBatches((prev) => {
      const next = [...prev, placeholderBatch];
      // Keep only last MAX_VISIBLE_BATCHES + 1 so AnimatePresence can animate the exit
      return next.slice(-(MAX_VISIBLE_BATCHES + 1));
    });

    const results = await translateToAllLanguages(chunkText, sourceLang);

    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId ? { ...b, translations: results, isTranslating: false } : b
      )
    );
  }, [detectedLanguage]);

  // Watch for new transcript lines and translate each one
  useEffect(() => {
    if (transcriptLines.length <= processedCountRef.current) return;

    const newLines = transcriptLines.slice(processedCountRef.current);
    processedCountRef.current = transcriptLines.length;

    for (const line of newLines) {
      if (!line.trim()) continue;
      const id = ++batchIdRef.current;
      translateChunk(line.trim(), id);
    }
  }, [transcriptLines, translateChunk]);

  const handleNewRecording = () => {
    clearTranscript();
    setBatches([]);
    processedCountRef.current = 0;
    batchIdRef.current = 0;
  };

  // Only show the last MAX_VISIBLE_BATCHES
  const visibleBatches = batches.slice(-MAX_VISIBLE_BATCHES);
  const showTranslations = batches.length > 0;

  const MAX_BARS = 80;
  const displayLevels =
    audioLevels.length >= MAX_BARS
      ? audioLevels.slice(-MAX_BARS)
      : [...Array(MAX_BARS - audioLevels.length).fill(0.05), ...audioLevels];

  return (
    <div className="min-h-svh flex flex-col bg-[#fafbfc]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Speech to Text + Translate</h1>
            <p className="text-sm text-gray-500">Real-time STT with live translation to all Indian languages</p>
          </div>
          <div className="flex items-center gap-2">
            {detectedLanguage && (
              <span className="text-xs px-3 py-1.5 bg-[#f0f4ff] text-[#4263eb] rounded-full font-medium">
                {LANGUAGES.find((l) => l.code === detectedLanguage)?.name || detectedLanguage}
              </span>
            )}
            {isRecording && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* STT Section */}
        <section className={`relative flex flex-col items-center justify-center px-6 py-10 ${showTranslations ? 'min-h-0' : 'min-h-[420px]'}`}>
          {/* Idle state */}
          {!isRecording && transcriptLines.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#4c6ef5] opacity-20 animate-pulse-ring" />
                <button
                  onClick={startRecording}
                  className="relative z-10 w-24 h-24 rounded-full bg-[#4c6ef5] text-white flex items-center justify-center shadow-lg shadow-[#4c6ef5]/30 hover:bg-[#4263eb] hover:shadow-xl hover:shadow-[#4c6ef5]/40 transition-all duration-200 active:scale-95"
                >
                  <MicIcon className="w-10 h-10" />
                </button>
              </div>
              <div className="text-center">
                <p className="text-gray-600 font-medium">Tap to start speaking</p>
                <p className="text-sm text-gray-400 mt-1">Each phrase translates to all languages instantly</p>
              </div>
              {sttError && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{sttError}</p>
              )}
            </motion.div>
          )}

          {/* Recording state */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 w-full max-w-2xl"
            >
              {/* Live transcript - only latest chunk */}
              <div className="w-full min-h-[60px] flex items-center justify-center px-4">
                {transcriptLines.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={transcriptLines.length}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="text-xl md:text-2xl text-center text-gray-800 leading-relaxed font-medium"
                    >
                      {transcriptLines[transcriptLines.length - 1]}
                    </motion.p>
                  </AnimatePresence>
                ) : (
                  <p className="text-lg text-gray-400 animate-pulse">Listening...</p>
                )}
              </div>

              {/* Waveform bar */}
              <div className="w-full max-w-xl">
                <div className="px-5 py-4 rounded-full bg-gray-100 flex items-center gap-4">
                  <span className="text-sm text-gray-500 font-mono tabular-nums min-w-[48px]">
                    {formatTime(recordingTime)}
                  </span>
                  <div className="flex items-center flex-1 min-w-0 overflow-hidden justify-between h-9">
                    {displayLevels.map((level, i) => (
                      <WaveformBar key={i} level={level} index={i} total={displayLevels.length} isMobile={isMobile} />
                    ))}
                  </div>
                  <button
                    onClick={stopRecording}
                    className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm active:scale-95"
                  >
                    <StopIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Post-recording - only latest chunk + new recording button */}
          {!isRecording && transcriptLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-5 w-full max-w-2xl"
            >
              <div className="w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Latest Transcription</span>
                  {detectedLanguage && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-500">
                      {LANGUAGES.find((l) => l.code === detectedLanguage)?.name || detectedLanguage}
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-800 leading-relaxed">{transcriptLines[transcriptLines.length - 1]}</p>
              </div>

              <button
                onClick={handleNewRecording}
                className="px-5 py-2.5 rounded-full bg-[#4c6ef5] text-white text-sm font-medium hover:bg-[#4263eb] transition-colors shadow-sm"
              >
                New Recording
              </button>
            </motion.div>
          )}
        </section>

        {/* Translation batches - each chunk is its own batch */}
        <AnimatePresence mode="popLayout">
          {showTranslations && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 pb-12"
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <h2 className="text-lg font-semibold text-gray-900">Live Translations</h2>

                <AnimatePresence mode="popLayout">
                  {[...visibleBatches].reverse().map((batch, i) => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      isFading={i > 0 && visibleBatches.length >= MAX_VISIBLE_BATCHES}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
