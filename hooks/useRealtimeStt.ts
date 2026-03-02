'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculateAudioLevel,
} from '@/lib/audio-utils';
import {
  SARVAM_API_KEY,
  SARVAM_WS_URL,
} from '@/lib/constants';

const MAX_AUDIO_LEVELS = 100;
const SAMPLE_RATE = 16000;
const CHUNK_SIZE = SAMPLE_RATE * 0.5; // 500ms

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

function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
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

  const sendAudioData = useCallback((int16Data: Int16Array) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const bytes = new Uint8Array(int16Data.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    wsRef.current.send(
      JSON.stringify({
        audio: {
          data: base64Audio,
          encoding: 'audio/wav',
          sample_rate: SAMPLE_RATE,
        },
      })
    );
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

      const params = new URLSearchParams({
        'language-code': 'unknown',
        'model': 'saaras:v3',
        'mode': 'transcribe',
        'vad_signals': 'true',
      });
      const wsUrl = `${SARVAM_WS_URL}?${params.toString()}`;

      const trimmedKey = SARVAM_API_KEY.trim();
      const subprotocol = trimmedKey ? [`api-subscription-key.${trimmedKey}`] : undefined;

      const ws = new WebSocket(wsUrl, subprotocol);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            reject(new Error('WebSocket connection timed out'));
          }
        }, 10000);

        ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed'));
        };
      });

      if (ws.readyState !== WebSocket.OPEN) {
        throw new Error('Could not connect to Sarvam STT service. Please try again.');
      }

      wsRef.current = ws;
      setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'error') {
            const errorData = data.data as { error: string; code: string };
            setError(`${errorData.code}: ${errorData.error}`);
            return;
          }

          if (data.type === 'data') {
            const text = cleanTranscriptText(data.data?.transcript || '');
            if (text) {
              setFullTranscript((prev) => (prev ? `${prev} ${text}` : text));
              setTranscriptLines((prev) => [...prev, text]);
            }
            if (data.data?.language_code) {
              setDetectedLanguage(data.data.language_code);
            }
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
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, sampleRate: SAMPLE_RATE },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContextClass!({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') await audioCtx.resume();

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

        if (chunksRef.current.length >= CHUNK_SIZE) {
          const chunk = chunksRef.current;
          chunksRef.current = new Float32Array(0);
          const int16 = float32ToInt16(chunk);
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

    if (wsRef.current?.readyState === WebSocket.OPEN && chunksRef.current.length > 0) {
      const int16 = float32ToInt16(chunksRef.current);
      sendAudioData(int16);
      wsRef.current.send(JSON.stringify({ type: 'flush' }));
    }

    wsRef.current?.close();
    wsRef.current = null;
    chunksRef.current = new Float32Array(0);
  }, [sendAudioData]);

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
