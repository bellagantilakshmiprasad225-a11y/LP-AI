import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechSynthesisOptions {
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  isSupported: boolean;
  speak: (text: string, options?: UseSpeechSynthesisOptions) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  });
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const updateVoices = useCallback(() => {
    if (!isSupported) return;
    const available = window.speechSynthesis.getVoices();
    if (available.length > 0) {
      setVoices(available);
    }
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported, updateVoices]);


  // Clean formatted markdown/symbols before speech synthesis
  const cleanSpeechText = (raw: string): string => {
    return raw
      .replace(/[*#_`~>]/g, '') // Remove markdown characters
      .replace(/•\s*/g, '') // Remove bullet points
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
      .replace(/https?:\/\/\S+/g, 'link') // Shorten URLs
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback((text: string, options?: UseSpeechSynthesisOptions) => {
    if (!isSupported || !text) return;

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    const cleaned = cleanSpeechText(text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    currentUtteranceRef.current = utterance;

    // Apply voice settings
    if (options?.voiceName && voices.length > 0) {
      const matched = voices.find(v => v.name === options.voiceName);
      if (matched) utterance.voice = matched;
    } else if (voices.length > 0) {
      // Pick best default: English natural/female or default
      const preferred = voices.find(v => 
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Siri')) &&
        v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (preferred) utterance.voice = preferred;
    }

    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      if (options?.onError) options.onError(e);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
  }, [isSupported]);

  return {
    isSpeaking,
    voices,
    isSupported,
    speak,
    cancel,
    pause,
    resume,
  };
}
