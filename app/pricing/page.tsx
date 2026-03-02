'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const STT_RATE_PER_MIN = 0.5;       // ₹0.50 per minute (₹30/hour)
const TRANSLATE_RATE_PER_CHAR = 0.002; // ₹0.002 per character (₹20/10K chars)

const QUICK_ROWS = [1, 5, 10, 30, 60];

function formatINR(value: number): string {
  if (value < 1) return `₹${value.toFixed(2)}`;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PricingPage() {
  const [minutes, setMinutes] = useState(5);
  const [languages, setLanguages] = useState(11);
  const [charsPerChunk, setCharsPerChunk] = useState(150);
  const [chunksPerMin, setChunksPerMin] = useState(5);

  const calc = useMemo(() => {
    const sttCost = minutes * STT_RATE_PER_MIN;
    const totalChunks = minutes * chunksPerMin;
    const totalChars = totalChunks * charsPerChunk * languages;
    const translateCost = totalChars * TRANSLATE_RATE_PER_CHAR;
    const totalCost = sttCost + translateCost;
    return { sttCost, translateCost, totalCost, totalChunks, totalChars };
  }, [minutes, languages, charsPerChunk, chunksPerMin]);

  const quickTable = useMemo(() => {
    return QUICK_ROWS.map((m) => {
      const stt = m * STT_RATE_PER_MIN;
      const chars = m * chunksPerMin * charsPerChunk * languages;
      const trans = chars * TRANSLATE_RATE_PER_CHAR;
      return { minutes: m, stt, trans, total: stt + trans };
    });
  }, [languages, charsPerChunk, chunksPerMin]);

  return (
    <div className="min-h-svh bg-[#fafbfc]">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
        >
          Pricing Calculator
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-500 max-w-xl mx-auto"
        >
          Estimate your costs for real-time STT + translation using Sarvam AI APIs.
        </motion.p>
      </section>

      {/* Free credits banner */}
      <section className="max-w-4xl mx-auto px-6 pb-8">
        <div className="rounded-xl bg-gradient-to-r from-[#4c6ef5] to-[#7c3aed] p-5 text-white text-center">
          <p className="text-sm font-medium opacity-90">Every new user gets</p>
          <p className="text-2xl font-bold mt-1">₹1,000 Free Credits</p>
          <p className="text-xs opacity-75 mt-1">
            Enough for ~33 hours of STT or ~5 million translated characters
          </p>
        </div>
      </section>

      {/* Rate Cards */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎙️</span>
              <h3 className="text-sm font-semibold text-gray-900">Speech-to-Text</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹30<span className="text-sm font-normal text-gray-400">/hour</span></p>
            <p className="text-xs text-gray-500 mt-1">₹0.50/min, charged per second, rounded up</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌐</span>
              <h3 className="text-sm font-semibold text-gray-900">Translation (Mayura v1)</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹20<span className="text-sm font-normal text-gray-400">/10K chars</span></p>
            <p className="text-xs text-gray-500 mt-1">₹0.002/character, charged per character</p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Cost Calculator</h2>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
            {/* Input: Minutes */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Audio Duration</label>
                <span className="text-sm font-semibold text-[#4c6ef5]">{minutes} min</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4c6ef5]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 min</span>
                <span>60 min</span>
              </div>
            </div>

            {/* Input: Languages */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Target Languages</label>
                <span className="text-sm font-semibold text-[#4c6ef5]">{languages}</span>
              </div>
              <input
                type="range"
                min={1}
                max={11}
                value={languages}
                onChange={(e) => setLanguages(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4c6ef5]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 lang</span>
                <span>11 langs</span>
              </div>
            </div>

            {/* Input: Chars per chunk */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Avg Characters per Chunk</label>
                <span className="text-sm font-semibold text-[#4c6ef5]">{charsPerChunk}</span>
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={10}
                value={charsPerChunk}
                onChange={(e) => setCharsPerChunk(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4c6ef5]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>50 chars</span>
                <span>500 chars</span>
              </div>
            </div>

            {/* Input: Chunks per minute */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Chunks per Minute</label>
                <span className="text-sm font-semibold text-[#4c6ef5]">{chunksPerMin}</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                value={chunksPerMin}
                onChange={(e) => setChunksPerMin(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4c6ef5]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1/min</span>
                <span>12/min</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">STT Cost</p>
                <p className="text-lg font-bold text-gray-900">{formatINR(calc.sttCost)}</p>
                <p className="text-[10px] text-gray-400 mt-1">{minutes} min &times; ₹0.50</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Translation Cost</p>
                <p className="text-lg font-bold text-gray-900">{formatINR(calc.translateCost)}</p>
                <p className="text-[10px] text-gray-400 mt-1">{calc.totalChars.toLocaleString('en-IN')} chars</p>
              </div>
              <div className="rounded-xl bg-[#f0f4ff] p-4 text-center">
                <p className="text-xs text-[#4263eb] font-medium mb-1">Total Cost</p>
                <p className="text-xl font-bold text-[#4c6ef5]">{formatINR(calc.totalCost)}</p>
                <p className="text-[10px] text-gray-400 mt-1">{calc.totalChunks} chunks &times; {languages} langs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Reference Table */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Reference</h2>
          <p className="text-xs text-gray-500 mb-4">
            Based on your settings: {languages} languages, ~{charsPerChunk} chars/chunk, ~{chunksPerMin} chunks/min
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">STT</th>
                  <th className="pb-3 font-medium">Translation</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {quickTable.map((row) => (
                  <tr key={row.minutes} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-700 font-medium">{row.minutes} min</td>
                    <td className="py-3 text-gray-600">{formatINR(row.stt)}</td>
                    <td className="py-3 text-gray-600">{formatINR(row.trans)}</td>
                    <td className="py-3 text-right font-semibold text-gray-900">{formatINR(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Link to docs */}
      <section className="text-center pb-16 space-y-4">
        <a
          href="https://docs.sarvam.ai/api-reference-docs/getting-started/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View Full Pricing on Sarvam Docs &rarr;
        </a>
        <div>
          <Link
            href="/"
            className="inline-flex px-6 py-3 rounded-full bg-[#4c6ef5] text-white font-medium text-sm hover:bg-[#4263eb] transition-colors shadow-sm"
          >
            Try the Live Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
