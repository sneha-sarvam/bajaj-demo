'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

function MicIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function WaveformIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2l3-9 4 18 4-18 3 9h2" />
    </svg>
  );
}

function ZapIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function FileTextIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function GlobeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function LayoutIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="9" x2="9" y1="21" y2="9" />
    </svg>
  );
}

const FLOW_STEPS = [
  {
    Icon: MicIcon,
    title: 'Microphone Input',
    desc: 'Browser captures audio via getUserMedia with echo cancellation and noise suppression.',
    detail: 'channelCount: 1, sampleRate: 16kHz',
    color: '#4c6ef5',
  },
  {
    Icon: WaveformIcon,
    title: 'Audio Processing',
    desc: 'Raw audio is downsampled to 16kHz, converted to Int16 PCM, then Base64-encoded in 500ms chunks.',
    detail: 'ScriptProcessorNode, 500ms chunks',
    color: '#7c3aed',
  },
  {
    Icon: ZapIcon,
    title: 'Sarvam STT WebSocket',
    desc: 'Chunks stream over WebSocket to Sarvam saaras:v3 model in codemix mode for real-time transcription.',
    detail: 'wss://api.sarvam.ai/speech-to-text/ws',
    color: '#059669',
  },
  {
    Icon: FileTextIcon,
    title: 'Live Transcript',
    desc: 'Each finalized transcript chunk is displayed instantly. Rolling window shows only the latest chunk.',
    detail: 'Codemix: English + native script',
    color: '#d97706',
  },
  {
    Icon: GlobeIcon,
    title: 'Sarvam Translate API',
    desc: 'Each transcript chunk is sent to the Translate API (mayura:v1) in parallel for all 11 Indian languages.',
    detail: 'POST /translate, Promise.allSettled',
    color: '#dc2626',
  },
  {
    Icon: LayoutIcon,
    title: 'Translation Cards',
    desc: 'Translations appear as a grid of language cards. Latest batch on top, older batches fade out.',
    detail: 'Rolling window: 2 visible batches',
    color: '#0891b2',
  },
];

const TECH_STACK = [
  { name: 'Next.js 15', desc: 'App Router, React Server Components' },
  { name: 'Sarvam AI', desc: 'STT (saaras:v3) + Translate (mayura:v1)' },
  { name: 'Tailwind CSS', desc: 'Utility-first styling, responsive design' },
  { name: 'Framer Motion', desc: 'Smooth animations for rolling batches' },
];

const API_DETAILS = [
  {
    title: 'Speech-to-Text (WebSocket)',
    endpoint: 'wss://api.sarvam.ai/speech-to-text/ws',
    params: [
      { key: 'model', value: 'saaras:v3' },
      { key: 'mode', value: 'codemix' },
      { key: 'language-code', value: 'unknown (auto-detect)' },
      { key: 'vad_signals', value: 'true' },
      { key: 'sample_rate', value: '16000' },
    ],
    audio: 'Base64-encoded Int16 PCM, 500ms chunks via JSON',
    auth: 'api-subscription-key (query param + subprotocol)',
  },
  {
    title: 'Translation (REST)',
    endpoint: 'POST https://api.sarvam.ai/translate',
    params: [
      { key: 'model', value: 'mayura:v1' },
      { key: 'mode', value: 'formal' },
      { key: 'source_language_code', value: 'auto-detected from STT' },
      { key: 'target_language_code', value: '11 Indian languages' },
    ],
    auth: 'api-subscription-key header',
  },
];

const DESIGN_DECISIONS = [
  {
    title: 'Chunk-per-chunk Translation',
    desc: 'Each STT transcript chunk is translated independently instead of accumulating the full transcript. This avoids the 2000-character API limit and provides faster feedback.',
  },
  {
    title: 'Rolling Window Display',
    desc: 'Only the latest 2 translation batches are visible. Older batches animate out smoothly with Framer Motion, keeping the UI clean and focused.',
  },
  {
    title: 'Codemix Output',
    desc: 'STT runs in codemix mode: English words stay in English, Indic words appear in native script. This reflects natural code-switching in Indian conversations.',
  },
  {
    title: 'Parallel Translation',
    desc: 'All 11 language translations fire concurrently via Promise.allSettled, with individual error handling so one failure does not block others.',
  },
];

function Arrow() {
  return (
    <div className="hidden md:flex items-center justify-center px-1">
      <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="text-gray-300">
        <path d="M0 6H24M24 6L19 1M24 6L19 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ArrowDown() {
  return (
    <div className="flex md:hidden items-center justify-center py-1">
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" className="text-gray-300">
        <path d="M6 0V16M6 16L1 11M6 16L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-svh bg-[#fafbfc]">
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
        >
          How It Works
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed"
        >
          Real-time speech recognition with instant translation to 11 Indian languages,
          powered by Sarvam AI&apos;s streaming APIs.
        </motion.p>
      </section>

      {/* Pipeline */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-lg font-semibold text-gray-900 mb-8 text-center">Pipeline</h2>

        <div className="hidden md:flex items-stretch justify-center gap-0">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.title} className="contents">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col w-[156px] rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: step.color + '14', color: step.color }}
                >
                  <step.Icon />
                </div>
                <h3 className="text-[13px] font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 flex-1 leading-relaxed">{step.desc}</p>
                <span
                  className="mt-3 text-[10px] font-mono px-2 py-1 rounded-md"
                  style={{ backgroundColor: step.color + '0a', color: step.color }}
                >
                  {step.detail}
                </span>
              </motion.div>
              {i < FLOW_STEPS.length - 1 && <Arrow />}
            </div>
          ))}
        </div>

        <div className="flex md:hidden flex-col items-center gap-0">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.title} className="contents">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: step.color + '14', color: step.color }}
                  >
                    <step.Icon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                    <span
                      className="inline-block mt-2 text-[10px] font-mono px-2 py-1 rounded-md"
                      style={{ backgroundColor: step.color + '0a', color: step.color }}
                    >
                      {step.detail}
                    </span>
                  </div>
                </div>
              </motion.div>
              {i < FLOW_STEPS.length - 1 && <ArrowDown />}
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TECH_STACK.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center"
            >
              <h3 className="text-sm font-semibold text-gray-900">{tech.name}</h3>
              <p className="text-xs text-gray-500 mt-1.5">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* API Details */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">API Configuration</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {API_DETAILS.map((api) => (
            <div key={api.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{api.title}</h3>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <code className="text-xs text-[#4c6ef5] break-all">{api.endpoint}</code>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {api.params.map((p) => (
                    <tr key={p.key} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 font-mono text-gray-500 pr-3">{p.key}</td>
                      <td className="py-1.5 text-gray-700">{p.value}</td>
                    </tr>
                  ))}
                  {'audio' in api && (
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 font-mono text-gray-500 pr-3">audio</td>
                      <td className="py-1.5 text-gray-700">{api.audio}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1.5 font-mono text-gray-500 pr-3">auth</td>
                    <td className="py-1.5 text-gray-700">{api.auth}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* Design Decisions */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Key Design Decisions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {DESIGN_DECISIONS.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{d.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{d.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="text-center pb-16">
        <Link
          href="/"
          className="inline-flex px-6 py-3 rounded-full bg-[#4c6ef5] text-white font-medium text-sm hover:bg-[#4263eb] transition-colors shadow-sm"
        >
          Try the Live Demo
        </Link>
      </section>
    </div>
  );
}
