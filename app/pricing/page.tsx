'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const STT_RATE_PER_MIN = 0.5;
const TRANSLATE_RATE_PER_CHAR = 0.002;
const QUICK_ROWS = [1, 5, 10, 30, 60];

function formatINR(value: number): string {
  if (value < 1) return `₹${value.toFixed(2)}`;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}

function SliderWithInput({ label, value, min, max, step = 1, unit, onChange }: SliderWithInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') return;
              onChange(clamp(Number(raw), min, max));
            }}
            className="w-[72px] text-right text-sm font-semibold text-[#4c6ef5] bg-gray-50 border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#4c6ef5] focus:border-[#4c6ef5] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-gray-400 w-8">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4c6ef5]"
      />
      <div className="flex justify-between text-[11px] text-gray-400 mt-1">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
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
          className="text-base text-gray-500 max-w-xl mx-auto"
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
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Speech-to-Text</h3>
            <p className="text-2xl font-bold text-gray-900">₹30<span className="text-sm font-normal text-gray-400"> /hour</span></p>
            <p className="text-xs text-gray-500 mt-1">₹0.50/min, charged per second</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Translation (Mayura v1)</h3>
            <p className="text-2xl font-bold text-gray-900">₹20<span className="text-sm font-normal text-gray-400"> /10K chars</span></p>
            <p className="text-xs text-gray-500 mt-1">₹0.002/character</p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Cost Calculator</h2>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
            <SliderWithInput
              label="Audio Duration"
              value={minutes}
              min={1}
              max={120}
              unit="min"
              onChange={setMinutes}
            />
            <SliderWithInput
              label="Target Languages"
              value={languages}
              min={1}
              max={11}
              unit=""
              onChange={setLanguages}
            />
            <SliderWithInput
              label="Avg Characters per Chunk"
              value={charsPerChunk}
              min={10}
              max={1000}
              step={10}
              unit="chars"
              onChange={setCharsPerChunk}
            />
            <SliderWithInput
              label="Chunks per Minute"
              value={chunksPerMin}
              min={1}
              max={20}
              unit="/min"
              onChange={setChunksPerMin}
            />
          </div>

          {/* Results */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">STT Cost</p>
                <p className="text-lg font-bold text-gray-900">{formatINR(calc.sttCost)}</p>
                <p className="text-[10px] text-gray-400 mt-1">{minutes} min &times; ₹0.50</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Translation Cost</p>
                <p className="text-lg font-bold text-gray-900">{formatINR(calc.translateCost)}</p>
                <p className="text-[10px] text-gray-400 mt-1">{calc.totalChars.toLocaleString('en-IN')} chars</p>
              </div>
              <div className="rounded-xl bg-[#f0f4ff] border border-[#e0e8ff] p-4 text-center">
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
            Based on your settings: {languages} language{languages > 1 ? 's' : ''}, ~{charsPerChunk} chars/chunk, ~{chunksPerMin} chunks/min
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

      <section className="text-center pb-16 space-y-4">
        <a
          href="https://docs.sarvam.ai/api-reference-docs/getting-started/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View Full Pricing on Sarvam Docs
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
