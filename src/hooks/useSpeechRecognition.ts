import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browsers
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  audioLevel: number; // 0 - 100
  frequencyData: number[]; // 16 frequency bands
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(
  onResultFinal?: (result: string) => void,
  onErrorCallback?: (error: string) => void
): UseSpeechRecognitionReturn {
  const isSupported = typeof window !== 'undefined' && !!(
    (window as unknown as IWindow).SpeechRecognition ||
    (window as unknown as IWindow).webkitSpeechRecognition
  );

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(() => 
    !isSupported ? 'Speech Recognition API not supported in this browser environment. Use modern Chrome or Edge, or use text input.' : null
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<number[]>(() => new Array(16).fill(0));

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopAudioAnalysis = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyData(new Array(16).fill(0));
  }, []);

  // Real-time microphone audio visualizer
  const startAudioAnalysis = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 255) * 160));
        setAudioLevel(normalized);

        // Sample 16 discrete bands for EQ visualization
        const bands: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 16));
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          bands.push(Math.round((val / 255) * 100));
        }
        setFrequencyData(bands);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch {
      // Audio stream error or blocked - will fallback to synthetic meter
    }
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRec = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;
    const recognition = new SpeechRec();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalTranscriptChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscriptChunk += item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      setInterimTranscript(currentInterim);

      if (finalTranscriptChunk) {
        setTranscript(prev => {
          const updated = prev ? `${prev} ${finalTranscriptChunk}` : finalTranscriptChunk;
          return updated;
        });
        setInterimTranscript('');
        if (onResultFinal) {
          onResultFinal(finalTranscriptChunk.trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech Recognition Error:', event.error);
      let errorMsg = `Speech error: ${event.error}`;
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
      } else if (event.error === 'no-speech') {
        return;
      } else if (event.error === 'network') {
        errorMsg = 'Speech service network error. Please verify internet connection.';
      }
      setError(errorMsg);
      if (onErrorCallback) {
        onErrorCallback(errorMsg);
      }
    };


    recognition.onend = () => {
      setIsListening(false);
      stopAudioAnalysis();
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
      stopAudioAnalysis();
    };
  }, [isSupported, onResultFinal, stopAudioAnalysis, onErrorCallback]);


  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      startAudioAnalysis();
    } catch (err: any) {
      console.log('Recognition start note:', err?.message);
    }
  }, [startAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    stopAudioAnalysis();
  }, [stopAudioAnalysis]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    audioLevel,
    frequencyData,
    startListening,
    stopListening,
    resetTranscript,
  };
}
