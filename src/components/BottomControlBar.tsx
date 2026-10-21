import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Send, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Sparkles
} from 'lucide-react';
import type { AICoreState } from '../types';
import { soundFx } from '../utils/soundEffects';

interface BottomControlBarProps {
  coreState: AICoreState;
  isListening: boolean;
  isVoiceOutputEnabled: boolean;
  transcript?: string;
  interimTranscript: string;
  onToggleListening: () => void;
  onSendMessage: (text: string, isVoice?: boolean) => void;
  onToggleVoiceOutput: () => void;
  onClearMessages: () => void;
  onSimulateVoiceCommand: (cmd: string) => void;
}

export const BottomControlBar: React.FC<BottomControlBarProps> = ({
  coreState: _coreState,
  isListening,
  isVoiceOutputEnabled,
  transcript: _transcript,
  interimTranscript,
  onToggleListening,
  onSendMessage,

  onToggleVoiceOutput,
  onClearMessages,
  onSimulateVoiceCommand,
}) => {
  const [inputText, setInputText] = useState('');
  const [showDemoCommands, setShowDemoCommands] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const demoPhrases = [
    'What is the capital of France?',
    'What is photosynthesis?',
    'How do airplanes fly?',
    'What is 15% of 80?',
    'Who painted the Mona Lisa?',
    'What is machine learning?',
    'How do I reverse a string in Python?',
    'What time is it right now?',
    'Run system diagnostics',
    'Open optical camera scanner',
    'Tell me a funny joke',
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;
    soundFx.play('message-sent');
    onSendMessage(inputText.trim(), false);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && isListening) {
      e.preventDefault();
      onToggleListening();
    }
  };

  return (
    <div className="w-full relative z-20 flex flex-col items-center">
      {/* Live Interim Transcript Banner while user is speaking */}
      {(isListening || interimTranscript) && (
        <div className="mb-2 w-full max-w-2xl px-4 py-2 rounded-lg bg-slate-900/90 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center justify-between backdrop-blur-md animate-pulse">
          <div className="flex items-center space-x-2 text-xs font-mono-code text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400 uppercase">HEARING:</span>
            <span className="italic text-white font-medium">
              "{interimTranscript || 'Listening for speech input...'}"
            </span>
          </div>
          <button
            onClick={() => onToggleListening()}
            className="text-[10px] text-cyan-400 hover:text-cyan-200 uppercase font-rajdhani border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-950/40"
          >
            Halt
          </button>
        </div>
      )}

      {/* Main Glass Control Dock */}
      <div className="w-full max-w-4xl glass-panel p-2.5 sm:p-3 rounded-2xl border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center gap-2 sm:gap-3">
        {/* 1. Large Glowing Center Microphone Button */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Animated concentric pulse ring when listening */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
          )}

          <button
            onClick={() => {
              if (isListening) {
                soundFx.play('listen-stop');
              } else {
                soundFx.play('listen-start');
              }
              onToggleListening();
            }}
            title={isListening ? 'Stop Listening (or press Esc)' : 'Start Voice Recognition'}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
              isListening
                ? 'bg-gradient-to-tr from-emerald-600 to-cyan-400 text-slate-950 shadow-[0_0_25px_#10b981] scale-105'
                : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-cyan-400 text-white hover:shadow-[0_0_20px_#00f0ff] hover:scale-105 active:scale-95'
            }`}
          >
            {isListening ? (
              <Mic className="w-6 h-6 animate-pulse" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* 2. Text Command Input Field */}
        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening 
                ? 'Listening to speech... or type here' 
                : 'Ask MAYA anything or type a system command...'
            }
            className="w-full bg-slate-950/70 border border-cyan-500/30 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner transition-all pr-24 font-mono-code"
          />

          {/* Quick Enter Key Hint & Send Button */}
          <div className="absolute right-2 flex items-center space-x-1.5">
            <span className="hidden sm:inline-block text-[10px] font-mono-code text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              ↵ Enter
            </span>
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              title="Execute Command"
              className={`p-2 rounded-lg transition-all ${
                inputText.trim()
                  ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.5)] cursor-pointer'
                  : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Voice Output Speaker Toggle */}
        <button
          onClick={() => {
            soundFx.play('click');
            onToggleVoiceOutput();
          }}
          title={isVoiceOutputEnabled ? 'Voice Feedback Enabled (Click to Mute)' : 'Voice Feedback Muted'}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all shrink-0 ${
            isVoiceOutputEnabled
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {isVoiceOutputEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
        </button>

        {/* 4. Simulated Voice Prompts Menu Trigger */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              soundFx.play('click');
              setShowDemoCommands(!showDemoCommands);
            }}
            title="Simulated Voice Triggers & Test Phrases"
            className="p-2.5 sm:p-3 rounded-xl border border-cyan-500/30 bg-slate-900/60 hover:bg-cyan-950/50 text-cyan-300 hover:border-cyan-400 transition-all flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </button>

          {/* Popup Menu with Demo Voice Phrases */}
          {showDemoCommands && (
            <div className="absolute bottom-14 right-0 w-64 glass-panel p-2.5 rounded-xl border border-cyan-500/40 shadow-2xl z-50 text-xs font-rajdhani">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-cyan-500/20">
                <span className="font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Voice Test Triggers
                </span>
                <button
                  onClick={() => setShowDemoCommands(false)}
                  className="text-slate-400 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Click any prompt to simulate voice trigger without a microphone:
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {demoPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundFx.play('listen-start');
                      onSimulateVoiceCommand(phrase);
                      setShowDemoCommands(false);
                    }}
                    className="w-full text-left p-1.5 rounded bg-slate-900/60 hover:bg-cyan-950 hover:border-cyan-500/40 border border-slate-800 text-[11px] font-mono-code text-cyan-300 hover:text-white transition-colors truncate"
                  >
                    › {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Clear conversation button */}
        <button
          onClick={() => {
            soundFx.play('alert');
            onClearMessages();
          }}
          title="Clear Conversation Logs"
          className="p-2.5 sm:p-3 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all shrink-0"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
