'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  downsampleAudio,
  float32ToInt16,
  calculateAudioLevel,
} from '@/lib/audio-utils';
import {
  SARVAM_API_KEY,
  SARVAM_WS_BASE,
  TARGET_SAMPLE_RATE,
  CHUNK_DURATION,
} from '@/lib/constants';

const MAX_AUDIO_LEVELS = 100;

const AudioContextClass =
  typeof window !== 'undefined'
    ? window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    : null;

function cleanTranscriptText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<nospeech>/gi, '')
    .replace(/<\/nospeech>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface UseRealtimeSttReturn {
  isRecording: boolean;
  isConnected: boolean;
  fullTranscript: string;
  transcriptLines: string[];
  error: string | null;
  recordingTime: number;
  audioLevel: number;
  audioLevels: number[];
  detectedLanguage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscript: () => void;
}

export function useRealtimeStt(): UseRealtimeSttReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fullTranscript, setFullTranscript] = useState('');
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Float32Array>(new Float32Array(0));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  const sendAudioData = useCallback((audioData: Int16Array) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const buf = new ArrayBuffer(audioData.byteLength);
    new Int16Array(buf).set(audioData);
    const blob = new Blob([buf], { type: 'audio/wav' });
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            audio: { data: base64, encoding: 'audio/wav', sample_rate: TARGET_SAMPLE_RATE },
          })
        );
      }
    };
    reader.readAsDataURL(blob);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsRecording(true);
      setRecordingTime(0);
      setFullTranscript('');
      setTranscriptLines([]);
      setDetectedLanguage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone not supported. Use a modern browser over HTTPS.');
      }
      if (!AudioContextClass) {
        throw new Error('Audio processing not supported in this browser.');
      }

      const wsUrl = `${SARVAM_WS_BASE}/speech-to-text/ws?language-code=unknown&model=saaras:v3&mode=transcribe&high_vad_sensitivity=true&vad_signals=true`;
      const subprotocol = `api-subscription-key.${SARVAM_API_KEY}`;

      let ws: WebSocket | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const candidate = new WebSocket(wsUrl, [subprotocol]);
          await new Promise<void>((resolve, reject) => {
            candidate.onopen = () => resolve();
            candidate.onerror = () => reject(new Error('WebSocket failed'));
            setTimeout(() => {
              if (candidate.readyState !== WebSocket.OPEN) {
                candidate.close();
                reject(new Error('Timeout'));
              }
            }, 5000);
          });
          ws = candidate;
          break;
        } catch {
          if (attempt < 2) await new Promise((r) => setTimeout(r, (attempt + 1) * 300));
        }
      }

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('Could not connect to Sarvam STT service. Please try again.');
      }

      wsRef.current = ws;
      setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          const resp = JSON.parse(event.data);
          if (resp.type === 'data') {
            const text = cleanTranscriptText(resp.data?.transcript || '');
            if (text) {
              setFullTranscript((prev) => (prev ? `${prev} ${text}` : text));
              setTranscriptLines((prev) => [...prev, text]);
            }
            if (resp.data?.language_code) {
              setDetectedLanguage(resp.data.language_code);
            }
          } else if (resp.type === 'error') {
            setError(resp.data?.error || 'STT error');
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
        isRecordingRef.current = false;
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContextClass!({ latencyHint: 'interactive' });
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const nativeRate = audioCtx.sampleRate;
      const nativeChunkSize = Math.round(nativeRate * CHUNK_DURATION);

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      isRecordingRef.current = true;
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const level = calculateAudioLevel(input);
        setAudioLevel(level);
        setAudioLevels((prev) => {
          const next = [...prev, level];
          return next.length > MAX_AUDIO_LEVELS ? next.slice(-MAX_AUDIO_LEVELS) : next;
        });

        const merged = new Float32Array(chunksRef.current.length + input.length);
        merged.set(chunksRef.current);
        merged.set(input, chunksRef.current.length);
        chunksRef.current = merged;

        if (chunksRef.current.length >= nativeChunkSize) {
          const downsampled = downsampleAudio(chunksRef.current, nativeRate, TARGET_SAMPLE_RATE);
          const int16 = float32ToInt16(downsampled);
          chunksRef.current = new Float32Array(0);
          sendAudioData(int16);
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(msg);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [sendAudioData]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setAudioLevel(0);
    setAudioLevels([]);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    chunksRef.current = new Float32Array(0);
  }, []);

  const clearTranscript = useCallback(() => {
    setFullTranscript('');
    setTranscriptLines([]);
    setDetectedLanguage(null);
  }, []);

  useEffect(() => {
    return () => { stopRecording(); };
  }, [stopRecording]);

  return {
    isRecording,
    isConnected,
    fullTranscript,
    transcriptLines,
    error,
    recordingTime,
    audioLevel,
    audioLevels,
    detectedLanguage,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}
